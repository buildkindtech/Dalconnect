#!/usr/bin/env python3
"""
수집된 뉴스를 Replit PostgreSQL DB에 업로드
"""

import json
import sys
import requests
import os
from pathlib import Path
from datetime import datetime

# Replit API URL
REPLIT_API_URL = os.getenv('REPLIT_API_URL', 'https://dalconnect.replit.app/api')

def load_news(json_file):
    """JSON 파일에서 뉴스 로드"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ 파일 없음: {json_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 파싱 에러: {e}")
        sys.exit(1)

def upload_news_item(news_item):
    """단일 뉴스 아이템 업로드"""
    try:
        # API 형식에 맞게 변환
        payload = {
            "title": news_item['title'],
            "url": news_item['url'],
            "content": news_item.get('content', ''),
            "category": news_item['category'],
            "published_date": news_item['published_date'],
            "source": news_item['source'],
            "thumbnail_url": news_item.get('thumbnail_url', '')
        }
        
        response = requests.post(
            f"{REPLIT_API_URL}/news",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            return True, None
        elif response.status_code == 409:  # Conflict (중복)
            return True, "duplicate"
        else:
            return False, f"Status {response.status_code}: {response.text}"
    
    except requests.exceptions.RequestException as e:
        return False, str(e)

def upload_all(news_items, dry_run=False):
    """전체 뉴스 업로드"""
    print(f"\n📤 Replit 업로드 시작...")
    print(f"   API: {REPLIT_API_URL}")
    print(f"   뉴스: {len(news_items)}개\n")
    
    if dry_run:
        print("🔍 DRY RUN 모드 (실제 업로드 안 함)\n")
    
    success_count = 0
    duplicate_count = 0
    error_count = 0
    errors = []
    
    for i, news_item in enumerate(news_items, 1):
        title = news_item.get('title', 'Unknown')[:60]
        
        if dry_run:
            print(f"  [{i}/{len(news_items)}] Would upload: {title}")
            success_count += 1
            continue
        
        # 실제 업로드
        success, error = upload_news_item(news_item)
        
        if success:
            if error == "duplicate":
                print(f"  ⊚ [{i}/{len(news_items)}] {title} (중복)")
                duplicate_count += 1
            else:
                print(f"  ✓ [{i}/{len(news_items)}] {title}")
                success_count += 1
        else:
            print(f"  ✗ [{i}/{len(news_items)}] {title} - {error}")
            error_count += 1
            errors.append({'title': title, 'error': error})
    
    # 결과 요약
    print(f"\n{'='*60}")
    print(f"📊 업로드 완료:")
    print(f"  ✅ 성공: {success_count}")
    print(f"  ⊚ 중복: {duplicate_count}")
    print(f"  ❌ 실패: {error_count}")
    print(f"{'='*60}")
    
    if errors:
        print(f"\n⚠️  에러 ({len(errors)}개):")
        for err in errors[:10]:  # 최대 10개만
            print(f"  • {err['title']}: {err['error']}")
        
        if len(errors) > 10:
            print(f"  ... 외 {len(errors) - 10}개")
    
    return success_count, duplicate_count, error_count

def main():
    """메인 함수"""
    if len(sys.argv) < 2:
        print("사용법: python3 upload_to_replit.py <json_file> [--dry-run]")
        print("\n예시:")
        print("  python3 upload_to_replit.py output/news-20260221.json")
        print("  python3 upload_to_replit.py output/news-20260221.json --dry-run")
        sys.exit(1)
    
    json_file = sys.argv[1]
    dry_run = '--dry-run' in sys.argv
    
    # 뉴스 로드
    print(f"📂 로딩: {json_file}")
    news_items = load_news(json_file)
    print(f"   {len(news_items)}개 뉴스")
    
    # 업로드
    success, duplicates, errors = upload_all(news_items, dry_run=dry_run)
    
    if errors == 0:
        print("\n🎉 모든 뉴스 업로드 성공!")
    else:
        print(f"\n⚠️  {errors}개 뉴스 업로드 실패")
        print("   Replit API 로그 확인 필요")

if __name__ == "__main__":
    main()
