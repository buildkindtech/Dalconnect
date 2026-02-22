# 비즈니스 주소록 자동화 수집 전략

## 📊 Dalsaram.com 분석

**사이트**: https://www.dalsaram.com
**특징**:
- 텍사스 유일 한인 포털사이트
- Dallas, Austin, Houston 커버
- 한인 업소록 제공
- 뉴스 + 커뮤니티 통합

**우리와의 차이점**:
- 우리: DFW 집중, 현대적 UI, OpenClaw 자동화
- Dalsaram: 텍사스 전체, 전통적 포털 스타일

---

## 🎯 비즈니스 리스팅 자동 수집 방법 (500개 목표)

### **방법 1: Google Maps API** ⭐⭐⭐⭐⭐ (추천)

**장점:**
- 가장 정확한 데이터 (주소, 전화번호, 영업시간, 사진)
- 자동 업데이트 (폐업 시 자동 제거)
- 리뷰/평점 데이터 포함
- API 공식 지원

**비용:**
- Places API: 무료 $200 크레딧/월
- Text Search: $32/1000건
- Place Details: $17/1000건
- 500개 수집 비용: ~$25 (1회)
- 월간 업데이트: ~$10

**구현 방법:**

```bash
# Google Cloud Console에서 Places API 활성화
# API 키 생성

# OpenClaw 스킬: google-maps-scraper
```

**검색 쿼리 예시:**
```
"Korean restaurant" near "Carrollton, TX"
"Korean beauty salon" near "Dallas, TX"
"Korean lawyer" near "Plano, TX"
"Korean medical" near "Irving, TX"
"Korean church" near "Dallas, TX"
```

**Python 스크립트 예시:**

```python
import googlemaps
import json

gmaps = googlemaps.Client(key='YOUR_API_KEY')

categories = [
    "Korean restaurant",
    "Korean beauty salon",
    "Korean medical",
    "Korean lawyer",
    "Korean real estate",
    "Korean auto repair"
]

cities = ["Carrollton, TX", "Dallas, TX", "Plano, TX", "Irving, TX"]

businesses = []

for category in categories:
    for city in cities:
        query = f"{category} near {city}"
        results = gmaps.places(query=query)
        
        for place in results['results']:
            details = gmaps.place(place_id=place['place_id'])
            
            business = {
                "name_en": details['name'],
                "name_ko": "",  # 수동 추가 필요
                "category": category.replace("Korean ", ""),
                "address": details['formatted_address'],
                "phone": details.get('formatted_phone_number', ''),
                "website": details.get('website', ''),
                "rating": details.get('rating', 0),
                "photos": [photo['photo_reference'] for photo in details.get('photos', [])[:5]]
            }
            businesses.append(business)

# JSON 저장
with open('businesses.json', 'w') as f:
    json.dump(businesses, f, indent=2)
```

---

### **방법 2: Yelp API** ⭐⭐⭐⭐

**장점:**
- 리뷰 데이터 풍부
- 한인 업체 많이 등록
- 무료 API (5000 calls/day)

**단점:**
- Google보다 커버리지 낮음
- 영업시간 정확도 낮음

**구현:**
```bash
# Yelp Fusion API 키 발급
# https://www.yelp.com/developers/v3/manage_app

curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.yelp.com/v3/businesses/search?term=korean&location=Dallas,TX&limit=50"
```

---

### **방법 3: Web Scraping (Dalsaram.com)** ⭐⭐⭐

**장점:**
- 한인 업체만 타겟팅
- 한글 이름 자동 수집

**단점:**
- 법적 그레이존 (robots.txt 확인 필요)
- 사이트 구조 변경 시 스크립트 수정
- 데이터 정확도 낮을 수 있음

**구현:**

```python
from playwright.sync_api import sync_playwright
import json

def scrape_dalsaram():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 업소록 페이지 방문
        page.goto('https://www.dalsaram.com/business')
        
        # 카테고리별 크롤링
        categories = page.query_selector_all('.category-link')
        
        businesses = []
        
        for cat in categories:
            cat.click()
            listings = page.query_selector_all('.business-item')
            
            for listing in listings:
                name_ko = listing.query_selector('.name-ko').inner_text()
                name_en = listing.query_selector('.name-en').inner_text()
                phone = listing.query_selector('.phone').inner_text()
                address = listing.query_selector('.address').inner_text()
                
                businesses.append({
                    "name_ko": name_ko,
                    "name_en": name_en,
                    "phone": phone,
                    "address": address
                })
        
        browser.close()
        return businesses

# 실행
data = scrape_dalsaram()
with open('dalsaram-businesses.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

**주의:** robots.txt 확인 + 이용약관 검토 필수

---

### **방법 4: Claim Your Listing (역발상)** ⭐⭐⭐⭐⭐ (장기 전략)

**전략:**
1. Google Maps에서 500개 수집
2. 우리 사이트에 "무료 리스팅"으로 등록
3. 사업자에게 이메일: "귀하의 업체가 등록되었습니다. 소유권 확인하시겠어요?"
4. Claim 시 자동으로 정보 업데이트

**장점:**
- 초기 데이터 확보 빠름
- 사업자가 직접 정보 업데이트 → 정확도 UP
- 무료 → 유료 전환 기회

**이메일 템플릿:**
```
제목: [DFW Korean Directory] 귀하의 업체가 등록되었습니다

안녕하세요,

DFW Korean Directory에 귀하의 업체 "{{business_name}}"가 무료로 등록되었습니다.

현재 정보:
- 주소: {{address}}
- 전화번호: {{phone}}

사업주이신가요? 아래 링크를 클릭하여 소유권을 확인하고 더 많은 정보를 추가하세요:
→ {{claim_link}}

프리미엄 플랜으로 업그레이드하시면:
✓ 사진 무제한 업로드
✓ Featured 배지
✓ 검색 상위 노출

감사합니다,
DFW Korean Directory 팀
```

---

### **방법 5: 수동 크라우드소싱** ⭐⭐⭐

**전략:**
- 커뮤니티에 "우리 동네 한인 업체 추천해주세요!" 캠페인
- 추천 시 $5 Amazon 기프트카드
- 10개 이상 추천 시 $50

**장점:**
- 커뮤니티 참여 유도
- 바이럴 마케팅 효과

**단점:**
- 시간 오래 걸림
- 중복/스팸 관리 필요

---

## 🚀 추천 실행 플랜 (Hybrid)

### **Week 1: Google Maps API (자동)**
```bash
1. Google Cloud Console 세팅
2. OpenClaw 스킬 개발: google-maps-scraper
3. 8개 카테고리 x 5개 도시 = 500개 수집
4. JSON → PostgreSQL 삽입
```

**예상 시간:** 1일  
**예상 비용:** $25

---

### **Week 2: Claim Your Listing (반자동)**
```bash
1. 500개 비즈니스에 이메일 발송 (SendGrid)
2. Claim 링크 클릭 시 SMS 인증
3. 사업자가 정보 업데이트
```

**예상 전환율:** 5-10% (25-50개 claim)

---

### **Week 3: Dalsaram 스크래핑 (보충)**
```bash
1. Playwright 스크립트 실행
2. 한글 이름 매칭
3. 중복 제거
```

**예상 추가:** 100-200개

---

### **Week 4: 커뮤니티 크라우드소싱**
```bash
1. Facebook 그룹에 캠페인 포스팅
2. 추천 폼 생성
3. 리워드 발송
```

**예상 추가:** 50-100개

---

## 🛠️ OpenClaw 스킬 개발

### **Skill: google-maps-business-scraper**

**파일 구조:**
```
skills/google-maps-scraper/
├── SKILL.md
├── scrape.py
├── config.json
└── references/
    └── categories.json
```

**scrape.py:**
```python
#!/usr/bin/env python3
import googlemaps
import os
import json
from datetime import datetime

API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
gmaps = googlemaps.Client(key=API_KEY)

CATEGORIES = [
    "Korean restaurant",
    "Korean beauty salon",
    "Korean medical clinic",
    "Korean law firm",
    "Korean real estate",
    "Korean auto repair",
    "Korean church",
    "Korean education"
]

CITIES = [
    "Carrollton, TX",
    "Dallas, TX",
    "Plano, TX",
    "Irving, TX",
    "Richardson, TX"
]

def scrape_businesses():
    all_businesses = []
    
    for category in CATEGORIES:
        for city in CITIES:
            query = f"{category} near {city}"
            print(f"Searching: {query}")
            
            results = gmaps.places(query=query)
            
            for place in results.get('results', []):
                place_id = place['place_id']
                details = gmaps.place(place_id=place_id)['result']
                
                business = {
                    "name_en": details.get('name', ''),
                    "name_ko": "",  # TODO: 한글 이름 추출 로직
                    "category": category.replace("Korean ", ""),
                    "description": "",
                    "address": details.get('formatted_address', ''),
                    "city": city.split(',')[0],
                    "phone": details.get('formatted_phone_number', ''),
                    "email": "",
                    "website": details.get('website', ''),
                    "hours": details.get('opening_hours', {}).get('weekday_text', []),
                    "logo_url": "",
                    "cover_url": details.get('photos', [{}])[0].get('photo_reference', '') if details.get('photos') else "",
                    "photos": [p['photo_reference'] for p in details.get('photos', [])[:5]],
                    "tier": "free",
                    "featured": False,
                    "claimed": False,
                    "rating": details.get('rating', 0),
                    "review_count": details.get('user_ratings_total', 0),
                    "google_place_id": place_id
                }
                
                all_businesses.append(business)
                print(f"  ✓ {business['name_en']}")
    
    # 중복 제거 (같은 place_id)
    unique = {b['google_place_id']: b for b in all_businesses}
    final = list(unique.values())
    
    # JSON 저장
    output_file = f"businesses-{datetime.now().strftime('%Y%m%d')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 총 {len(final)}개 비즈니스 수집 완료")
    print(f"📁 저장: {output_file}")
    
    return final

if __name__ == "__main__":
    scrape_businesses()
```

**실행:**
```bash
export GOOGLE_MAPS_API_KEY="your-api-key"
python3 skills/google-maps-scraper/scrape.py
```

---

## 📋 체크리스트

### Phase 1 - 데이터 수집 (Week 1)
- [ ] Google Cloud Console 세팅
- [ ] Places API 활성화
- [ ] API 키 생성 & .env 저장
- [ ] google-maps-scraper 스킬 개발
- [ ] 500개 비즈니스 수집
- [ ] JSON → PostgreSQL 삽입

### Phase 2 - 데이터 정제 (Week 2)
- [ ] 중복 제거
- [ ] 한글 이름 수동 추가 (또는 GPT-4 자동 번역)
- [ ] 카테고리 표준화
- [ ] 사진 URL → 로컬 저장 (옵션)

### Phase 3 - Claim Your Listing (Week 2-3)
- [ ] Claim 링크 생성
- [ ] SendGrid 이메일 템플릿
- [ ] 500개 업체에 이메일 발송
- [ ] SMS 인증 시스템 (Twilio)

### Phase 4 - 추가 소스 (Week 3-4)
- [ ] Dalsaram.com 스크래핑 (robots.txt 확인 후)
- [ ] Yelp API 연동
- [ ] 커뮤니티 크라우드소싱 캠페인

---

## ⚠️ 법적 고려사항

### Google Maps API
✅ **합법** - 공식 API, Terms of Service 준수하면 OK

### Yelp API
✅ **합법** - 공식 API, 무료 티어 5000 calls/day

### Dalsaram.com 스크래핑
⚠️ **그레이존**
- robots.txt 확인 필수
- 이용약관 검토
- 개인정보 수집 시 동의 필요
- 가능하면 공식 제휴 요청 추천

### Claim Your Listing
✅ **합법** - 공개 정보 수집 + 사업자 확인 프로세스

---

## 💰 예상 비용

| 항목 | 비용 |
|------|------|
| Google Maps API (500개) | $25 (1회) |
| 월간 업데이트 (50개) | $10/월 |
| SendGrid (500 이메일) | 무료 |
| Twilio SMS (50개 인증) | $4 |
| **총 초기 비용** | **$29** |
| **월간 운영** | **$10** |

---

## 🎯 최종 추천

**Option A - 빠른 시작** (추천)
1. Google Maps API로 500개 수집 (1일)
2. Claim Your Listing 이메일 발송
3. 자동 업데이트 Cron (주간)

**Option B - 완벽주의**
1. Google Maps + Yelp + Dalsaram 통합
2. 중복 제거 + 데이터 검증
3. 커뮤니티 크라우드소싱
4. 3주 소요, 800-1000개 확보

**나의 선택: Option A** - 빠르게 500개 확보 → 런칭 → 점진적 확장

---

**다음 액션: Google Cloud Console 세팅 + API 키 발급**
