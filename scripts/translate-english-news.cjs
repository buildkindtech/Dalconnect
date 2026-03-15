const pg = require('pg');

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 1,
});

// 영어 기사별 한국어 번역 매핑
const translations = {
  'd7a9fabf-103b-4fcc-843e-b3a4c715d32e': {
    title: '미국, 이란 긴장 고조로 베이루트 대사관 부분 철수',
    koreanSummary: '미국 국무부가 이란과의 긴장 상황이 고조되면서 베이루트 대사관의 비필수 직원들을 철수시키라고 지시했습니다. 보안상 우려로 인한 예방 조치로, 지역 내 이란의 영향력 확대와 관련된 위협 평가가 반영된 것으로 보입니다.'
  },
  '3bbfe6a5-cb70-4c71-be89-05d13198581d': {
    title: '트럼프 행정부, 대법원 관세 위헌 판결 후 수습에 나서',
    koreanSummary: '트럼프 대통령이 대법원의 관세 프로그램 위헌 판결 이후 정책을 재구성하려고 노력하고 있습니다. 행정부는 새로운 법적 근거를 찾아 관세 정책을 다시 시행할 방안을 모색 중입니다. 무역 전쟁의 핵심 정책이 법적 도전에 직면하면서 새로운 전략이 필요한 상황입니다.'
  },
  'd26f4ba9-d392-4323-b46e-d85775d5535f': {
    title: '트럼프 임명 판사, 기밀문서 사건 잭 스미스 보고서 공개 금지',
    koreanSummary: '플로리다 연방법원의 에일린 캐넌 판사가 도널드 트럼프 전 대통령의 기밀문서 사건에 대한 특별검사 잭 스미스의 보고서 공개를 차단했습니다. 트럼프가 임명한 판사로, 특별검사의 수사 결과 공개가 법적 절차를 방해할 수 있다고 판단했습니다.'
  },
  '33343b4d-cb70-4f99-bf65-e14729ba9139': {
    title: '연방 판사들, 트럼프 행정부의 법원 명령 위반에 분노 표출',
    koreanSummary: '8월 이후 최소 35차례에 걸쳐 연방 판사들이 트럼프 행정부에 법원 명령을 준수하지 않은 이유를 설명하라고 요구했습니다. 이민 정책과 관련된 법원 명령들을 반복적으로 무시하면서 사법부와의 갈등이 심화되고 있습니다.'
  },
  'd8ec848c-dc89-4120-974d-1d3b8f2f8749': {
    title: '엔젤 패밀리들, 트럼프 지지 위해 워싱턴 재집결',
    koreanSummary: '불법체류자들에 의해 가족을 잃은 유족들이 다시 워싱턴으로 모여들어 트럼프 대통령을 지지하고 있습니다. 이들은 연방 의사당 연설을 앞두고 강경한 이민 정책을 지지하며 대통령과의 유대를 과시했습니다.'
  },
  'f5ba3484-4259-454c-89de-076a14907729': {
    title: 'CIA 정보로 멕시코 당국, 마약왕 엘 멘초 추적 성공',
    koreanSummary: '멕시코 당국이 CIA의 첩보 지원을 받아 악명 높은 마약왕 엘 멘초를 추적하는 데 성공했다고 발표했습니다. 그의 연인을 통해 위치를 파악한 것으로 알려졌으며, 미국과의 합동 수사가 결정적 역할을 했습니다.'
  },
  '79061341-049b-4f10-bf16-f042d4010c0b': {
    title: '멕시코 마약 카르텔 보스 사살 후 폭력 사태 확산',
    koreanSummary: '멕시코 정부가 주요 마약 카르텔 보스를 사살한 후, 무장 단체들이 도로를 봉쇄하고 슈퍼마켓과 은행에 방화하는 등 보복 폭력이 확산되고 있습니다. 영상들은 도시 곳곳에서 벌어진 무차별 폭력의 실상을 보여주고 있습니다.'
  },
  'ba7a38f7-0e5f-459e-8243-24f0a1fbee1a': {
    title: '뉴욕 대설! 시민들이 즐기는 눈 축제 현장',
    koreanSummary: '뉴욕시 전역에서 시민들이 썰매를 타고 눈싸움을 즐기며 겨울 축제 분위기를 만끽했습니다. 5개 자치구 곳곳에서 벌어진 즐거운 눈놀이 장면들이 포착되었으며, 도시가 하나로 어우러지는 따뜻한 순간들이 연출되었습니다.'
  },
  '1632160c-5c9a-483f-8df5-d3b44a187064': {
    title: '바이낸스 직원들, 17억 달러 상당 암호화폐 이란 송금 발견',
    koreanSummary: '세계 최대 암호화폐 거래소 바이낸스의 내부 조사팀이 17억 달러 상당의 암호화폐가 이란 관련 단체들로 송금된 것을 발견했습니다. 범죄 척결을 약속했던 바이낸스가 제재 위반 가능성에 직면하면서 새로운 논란이 제기되고 있습니다.'
  },
  '88e9cc50-cdeb-4216-91b8-eb49018bab32': {
    title: '척추동물 눈의 진화, 단 하나에서 시작되었다',
    koreanSummary: '찰스 다윈도 의문을 품었던 척추동물 눈의 진화 과정에 대한 새로운 연구 결과가 발표되었습니다. 과학자들은 모든 복잡한 눈이 하나의 공통 조상에서 출발했다는 증거를 제시하며, 진화생물학의 오래된 미스터리를 해결했습니다.'
  }
};

async function updateEnglishNews() {
  try {
    console.log('영어 기사들을 한국어로 업데이트 중...');
    
    for (const [id, translation] of Object.entries(translations)) {
      // 기존 내용 조회
      const existingResult = await pool.query('SELECT title, content FROM news WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        console.log(`기사 ID ${id}를 찾을 수 없습니다.`);
        continue;
      }
      
      const existing = existingResult.rows[0];
      const originalTitle = existing.title;
      const originalContent = existing.content || '';
      
      // 새로운 content: 한국어 요약 + 원본 영어 내용
      const newContent = translation.koreanSummary + '\n\n' + 
                        '--- 원문 ---\n' + 
                        'Original Title: ' + originalTitle + '\n\n' +
                        originalContent;
      
      // DB 업데이트
      await pool.query(
        'UPDATE news SET title = $1, content = $2 WHERE id = $3',
        [translation.title, newContent, id]
      );
      
      console.log(`✅ 업데이트 완료: ${translation.title}`);
    }
    
    console.log('\n모든 영어 기사 번역 완료!');
    
  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await pool.end();
  }
}

updateEnglishNews();