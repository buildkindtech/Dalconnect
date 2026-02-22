#!/usr/bin/env python3
"""
DFW News Aggregator - 신뢰할 수 있는 소스에서 최신 뉴스 수집
가짜 뉴스 방지 + 날짜 검증 + 중복 제거
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse, quote_plus
from difflib import SequenceMatcher
import hashlib

# 설정 파일 경로
SKILL_DIR = Path(__file__).parent.parent
CONFIG_FILE = SKILL_DIR / "config" / "sources.json"
OUTPUT_DIR = SKILL_DIR / "output"

# SearXNG 엔드포인트
SEARXNG_URL = "http://localhost:8080/search"

def load_config():
    """설정 파일 로드"""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def search_news(query, time_range="day"):
    """SearXNG로 뉴스 검색"""
    params = {
        "q": query,
        "format": "json",
        "categories": "news",
        "time_range": time_range
    }
    
    try:
        response = requests.get(SEARXNG_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get('results', [])
    except Exception as e:
        print(f"  ⚠️  검색 실패 ({query}): {e}")
        return []

def is_trusted_domain(url, trusted_domains):
    """URL이 신뢰할 수 있는 도메인인지 확인"""
    try:
        domain = urlparse(url).netloc.lower()
        # www. 제거
        domain = domain.replace('www.', '')
        
        # 화이트리스트 확인
        for trusted in trusted_domains:
            if trusted.lower() in domain:
                return True
        return False
    except:
        return False

def parse_published_date(result):
    """발행일 파싱 (SearXNG 결과에서)"""
    # SearXNG는 publishedDate 필드 제공
    if 'publishedDate' in result:
        try:
            # ISO 8601 형식
            return datetime.fromisoformat(result['publishedDate'].replace('Z', '+00:00'))
        except:
            pass
    
    # 현재 시간으로 fallback (최신 뉴스로 간주)
    return datetime.now()

def is_recent(pub_date, max_age_hours=48):
    """최근 뉴스인지 확인 (max_age_hours 이내)"""
    now = datetime.now()
    age = now - pub_date.replace(tzinfo=None)
    return age.total_seconds() / 3600 <= max_age_hours

def similarity(a, b):
    """문자열 유사도 (0.0 ~ 1.0)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def remove_duplicates(articles, threshold=0.9):
    """중복 제거 (제목 유사도 기반)"""
    unique = []
    seen_urls = set()
    
    for article in articles:
        # URL 중복 체크
        if article['url'] in seen_urls:
            continue
        
        # 제목 유사도 체크
        is_duplicate = False
        for existing in unique:
            if similarity(article['title'], existing['title']) >= threshold:
                # 더 최신 것으로 교체
                if article['published_date'] > existing['published_date']:
                    unique.remove(existing)
                    break
                else:
                    is_duplicate = True
                    break
        
        if not is_duplicate:
            unique.append(article)
            seen_urls.add(article['url'])
    
    return unique

def contains_spam_keywords(text, exclude_keywords):
    """스팸 키워드 포함 여부"""
    text_lower = text.lower()
    return any(keyword.lower() in text_lower for keyword in exclude_keywords)

def aggregate_all_news():
    """모든 소스에서 뉴스 수집"""
    print("🚀 DFW News Aggregator 시작...\n")
    
    # 설정 로드
    config = load_config()
    trusted_domains = config['trusted_domains']
    queries = config['search_queries']
    filters = config['filters']
    
    all_articles = []
    
    # 각 쿼리 실행
    for query_config in queries:
        query = query_config['query']
        category = query_config['category']
        time_range = query_config.get('time_range', 'day')
        max_results = query_config.get('max_results', 10)
        
        print(f"📰 검색: {query} ({category})")
        
        results = search_news(query, time_range)
        print(f"   {len(results)}개 결과")
        
        for result in results[:max_results]:
            title = result.get('title', '')
            url = result.get('url', '')
            content = result.get('content', '')
            
            # 기본 검증
            if not title or not url:
                continue
            
            # 제목 길이 검증
            if len(title) < filters['min_title_length'] or len(title) > filters['max_title_length']:
                continue
            
            # 신뢰할 수 있는 도메인인지 확인
            if not is_trusted_domain(url, trusted_domains):
                print(f"   ⚠️  신뢰할 수 없는 도메인: {urlparse(url).netloc}")
                continue
            
            # 스팸 키워드 체크
            if contains_spam_keywords(title + ' ' + content, filters['exclude_keywords']):
                print(f"   ⚠️  스팸 키워드 발견: {title[:50]}")
                continue
            
            # 발행일 파싱
            pub_date = parse_published_date(result)
            
            # 최신성 검증
            if not is_recent(pub_date, filters['max_age_hours']):
                print(f"   ⚠️  오래된 뉴스: {title[:50]}")
                continue
            
            # 썸네일 (있으면)
            thumbnail = result.get('thumbnail', result.get('img_src', ''))
            
            # 소스 도메인 추출
            source_domain = urlparse(url).netloc.replace('www.', '')
            
            article = {
                "title": title,
                "url": url,
                "content": content[:500] if content else "",  # 최대 500자
                "category": category,
                "published_date": pub_date.isoformat(),
                "source": source_domain,
                "thumbnail_url": thumbnail,
                "query": query
            }
            
            all_articles.append(article)
        
        print(f"   ✓ {len([a for a in all_articles if a['query'] == query])}개 수집\n")
    
    print(f"📊 총 {len(all_articles)}개 수집 (중복 제거 전)\n")
    
    # 중복 제거
    unique_articles = remove_duplicates(all_articles, filters['duplicate_similarity_threshold'])
    print(f"✨ 중복 제거 후: {len(unique_articles)}개\n")
    
    # 날짜순 정렬 (최신순)
    unique_articles.sort(key=lambda x: x['published_date'], reverse=True)
    
    return unique_articles

def save_to_json(articles, filename=None):
    """JSON 파일로 저장"""
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    if filename is None:
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        filename = f"news-{timestamp}.json"
    
    filepath = OUTPUT_DIR / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    
    print(f"💾 저장: {filepath}")
    print(f"📊 총 {len(articles)}개 뉴스")
    
    # 카테고리별 통계
    categories = {}
    for article in articles:
        cat = article['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📈 카테고리별:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  • {cat}: {count}개")
    
    return str(filepath)

def upload_to_replit(articles):
    """Replit API로 업로드 (선택적)"""
    # TODO: Replit API 엔드포인트 연동
    print("\n⏳ Replit 업로드는 나중에 구현...")
    pass

def main():
    """메인 함수"""
    try:
        articles = aggregate_all_news()
        
        if not articles:
            print("⚠️  수집된 뉴스가 없습니다.")
            return
        
        # JSON 저장
        filepath = save_to_json(articles)
        
        # Replit 업로드 (선택적)
        # upload_to_replit(articles)
        
        print("\n✅ 완료!")
        print(f"\n다음 단계:")
        print(f"  1. 확인: cat {filepath}")
        print(f"  2. Replit 업로드: python3 scripts/upload_to_replit.py {filepath}")
        
    except Exception as e:
        print(f"\n❌ 에러: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
