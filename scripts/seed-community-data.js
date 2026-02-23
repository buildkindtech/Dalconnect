#!/usr/bin/env node
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Sample posts data
const samplePosts = [
  // 자유게시판
  {
    nickname: '달라스엄마',
    title: '달라스 살기 좋은 동네 추천해주세요',
    content: '내년에 달라스로 이사 예정인데 한인들 많이 살고 학교 좋은 동네 어디인지 알려주세요. 예산은 30만 달러 정도 생각하고 있어요. 플레이노, 캐롤턴, 어빙 이런 곳들이 어떤가요?',
    category: '자유게시판',
    tags: ['이사', '동네추천', '부동산']
  },
  {
    nickname: '텍사스거주10년',
    title: '한국 택배 보내는 가장 저렴한 방법',
    content: '한국에 있는 부모님께 택배 보내야 하는데 어떤 회사가 가장 저렴하고 안전한지 알고 계신 분 있나요? USPS, UPS, FedEx 말고 한국 업체 중에 좋은 곳 있으면 추천 부탁드려요.',
    category: '자유게시판',
    tags: ['택배', '한국', '배송']
  },
  
  // 맛집/음식
  {
    nickname: '맛집헌터',
    title: '플레이노 새로 오픈한 한식당 "미담" 후기',
    content: '어제 플레이노 신시가지에 새로 오픈한 한식당 "미담" 다녀왔어요. 김치찌개랑 불고기 맛있었고 반찬도 깔끔했습니다. 가격은 좀 비싼 편이지만 맛은 괜찮네요. 주차장도 넓고 깨끗해요.',
    category: '맛집/음식',
    tags: ['한식당', '플레이노', '후기']
  },
  {
    nickname: '요리하는엄마',
    title: '집에서 만드는 김치찌개 레시피 공유',
    content: `아이들이 김치찌개를 너무 좋아해서 자주 끓이는데 제 레시피 공유해볼게요.
    
재료: 신김치, 돼지고기 목살, 두부, 대파, 양파
양념: 고춧가루, 다진마늘, 간장, 참기름

1. 신김치를 먹기 좋게 썰어서 참기름에 볶아주세요
2. 돼지고기 넣고 함께 볶다가 물 부어서 끓여주세요
3. 두부, 양파, 대파 넣고 간 맞춰서 완성!

H마트에서 사온 신김치 써도 맛있어요.`,
    category: '맛집/음식',
    tags: ['레시피', '김치찌개', '요리']
  },
  
  // 육아/교육
  {
    nickname: '고등학생엄마',
    title: '캐롤턴 한글학교 어떤가요?',
    content: '중학생 아이가 한글을 잘 못해서 한글학교 보내려고 하는데 캐롤턴 쪽에 좋은 한글학교 있나요? 토요일마다 다닐 수 있는 곳으로 찾고 있어요. 수업료나 커리큘럼 정보도 알려주시면 감사하겠습니다.',
    category: '육아/교육',
    tags: ['한글학교', '캐롤턴', '교육']
  },
  {
    nickname: 'SAT학원맘',
    title: 'SAT 학원 추천해주세요 (플레이노/앨런)',
    content: '11학년 아이 SAT 점수 올려야 해서 학원 알아보고 있어요. 플레이노나 앨런 쪽에 평판 좋은 SAT 학원 어디인지 추천해주세요. 수학은 800점 가까이 나오는데 영어가 많이 부족해요.',
    category: '육아/교육',
    tags: ['SAT', '학원추천', '영어']
  },
  
  // 생활정보
  {
    nickname: '운전면허갱신',
    title: '텍사스 운전면허 갱신 방법 (온라인 vs 방문)',
    content: `운전면허 갱신 시기가 다가와서 방법 알아봤는데 정리해서 공유해요.

온라인 갱신:
- 2년 연속 온라인으로 갱신했으면 이번엔 방문해야 함
- $25 수수료
- 바로 임시면허증 출력 가능

방문 갱신:
- 가까운 DPS 오피스 방문
- 시력검사 있음
- 대기시간 길어서 예약 추천

저는 Richardson DPS가 그나마 빨라서 거기로 갔어요.`,
    category: '생활정보',
    tags: ['운전면허', '갱신', 'DPS']
  },
  {
    nickname: '마트비교맘',
    title: 'H마트 vs 한남체인 vs 그랜드마트 가격 비교',
    content: '한인마트 3곳 가격 비교해봤어요. 김치, 라면, 고기 위주로 비교했는데 전체적으로는 한남체인이 제일 저렴하고 H마트는 물건 종류가 많아요. 그랜드마트는 채소류가 신선한 편이에요.',
    category: '생활정보',
    tags: ['마트', '가격비교', '쇼핑']
  },
  
  // 뷰티/패션
  {
    nickname: '뷰티러버',
    title: '달라스 네일샵 추천 (젤네일)',
    content: '젤네일 잘하는 네일샵 찾고 있어요. 가격대는 40-50달러 정도 생각하고 있고 한국분이 운영하시는 곳이면 더 좋겠어요. 리차드슨이나 플레이노 쪽으로 추천해주세요.',
    category: '뷰티/패션',
    tags: ['네일샵', '젤네일', '추천']
  },
  
  // 부동산
  {
    nickname: '부동산관심',
    title: '플레이노 집값 동향 어떤가요?',
    content: '플레이노 West쪽으로 집 알아보고 있는데 최근 집값이 많이 올랐다고 하던데 실제로 어떤가요? 내년까지 기다리는 게 나을까요 아니면 지금 사는 게 나을까요? 부동산 에이전트분들 조언 부탁드려요.',
    category: '부동산',
    tags: ['집값', '플레이노', '부동산']
  },
  
  // Q&A
  {
    nickname: '달라스신규',
    title: '달라스 한인 교회 추천해주세요',
    content: '달라스에 이사 온 지 얼마 안 되어서 교회를 찾고 있어요. 20-30대 청년부 활성화된 교회로 추천해주시면 감사하겠습니다. 가족 단위로 다니기 좋은 곳이면 더욱 좋겠어요.',
    category: 'Q&A',
    tags: ['교회', '청년부', '추천']
  },
  {
    nickname: '소셜궁금',
    title: '소셜 시큐리티 신청 절차 알려주세요',
    content: 'F1에서 OPT로 바뀌면서 소셜 시큐리티 신청할 수 있다고 들었는데 정확한 절차가 궁금해요. 어떤 서류들이 필요하고 어디에 가서 신청해야 하나요? 경험자분들 조언 부탁드려요.',
    category: 'Q&A',
    tags: ['소셜시큐리티', '신청', 'OPT']
  }
];

// Sample comments for each post
const sampleComments = [
  // Comments for post 1 (달라스 동네 추천)
  [
    { nickname: '플레이노거주맘', content: '저희는 플레이노 West쪽 살고 있는데 정말 좋아요! 한인 많고 학교도 좋고 H마트도 가까워서 편해요.' },
    { nickname: '캐롤턴20년', content: '캐롤턴도 추천드려요. 집값이 플레이노보다 저렴하면서도 학군이 나쁘지 않아요.' },
    { nickname: '어빙살아요', content: '어빙은 공항이 가까워서 비행기 소리가 좀 신경 쓰일 수 있어요. 그래도 교통은 편리해요.' }
  ],
  
  // Comments for post 2 (택배)
  [
    { nickname: '택배전문가', content: '한진택배나 천일택배 추천해요. 가격도 저렴하고 안전하게 잘 배송해줘요.' },
    { nickname: '한국택배맘', content: 'USPS Priority Mail International도 생각보다 빨라요. 1주일 정도면 도착해요.' }
  ],
  
  // Comments for post 3 (미담 후기)
  [
    { nickname: '플레이노맛집', content: '저도 다녀왔는데 정말 맛있더라고요! 된장찌개도 추천해요.' },
    { nickname: '한식러버', content: '가격이 좀 비싸긴 하지만 그만큼 맛은 보장되는 것 같아요.' }
  ],
  
  // Comments for post 4 (김치찌개 레시피)
  [
    { nickname: '요리초보', content: '레시피 감사해요! 오늘 당장 만들어봐야겠어요.' },
    { nickname: '김치찌개마스터', content: '저는 여기에 참치캔 하나 더 넣으면 더 맛있더라고요!' }
  ]
];

function hashIP(ip) {
  const salt = process.env.IP_HASH_SALT || 'dalconnect-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

async function seedCommunityData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding community data...');
    
    const passwordHash = await bcrypt.hash('sample123', 12);
    const testIPHash = hashIP('127.0.0.1');
    
    // Insert sample posts
    const insertedPosts = [];
    for (const post of samplePosts) {
      const result = await client.query(`
        INSERT INTO community_posts (nickname, password_hash, title, content, category, tags, ip_hash, views, likes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        post.nickname,
        passwordHash,
        post.title,
        post.content,
        post.category,
        JSON.stringify(post.tags || []),
        testIPHash,
        Math.floor(Math.random() * 100) + 10, // Random views 10-110
        Math.floor(Math.random() * 20) + 1    // Random likes 1-21
      ]);
      
      insertedPosts.push({
        id: result.rows[0].id,
        ...post
      });
    }
    
    console.log(`✅ Inserted ${insertedPosts.length} sample posts`);
    
    // Insert sample comments
    let totalComments = 0;
    for (let i = 0; i < Math.min(insertedPosts.length, sampleComments.length); i++) {
      const post = insertedPosts[i];
      const comments = sampleComments[i];
      
      for (const comment of comments) {
        await client.query(`
          INSERT INTO community_comments (post_id, nickname, password_hash, content, ip_hash, likes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          post.id,
          comment.nickname,
          passwordHash,
          comment.content,
          testIPHash,
          Math.floor(Math.random() * 10) + 1 // Random likes 1-11
        ]);
        totalComments++;
      }
      
      // Update comment count for the post
      await client.query(`
        UPDATE community_posts 
        SET comment_count = $1 
        WHERE id = $2
      `, [comments.length, post.id]);
    }
    
    console.log(`✅ Inserted ${totalComments} sample comments`);
    
    // Create some pinned posts
    await client.query(`
      UPDATE community_posts 
      SET is_pinned = true 
      WHERE id IN (
        SELECT id FROM community_posts 
        WHERE title LIKE '%추천%' 
        LIMIT 2
      )
    `);
    
    console.log('✅ Pinned some posts');
    
    // Insert some sample trending data
    await client.query(`
      INSERT INTO community_trends (period, trending_topics, popular_keywords, recommended_content)
      VALUES ($1, $2, $3, $4)
    `, [
      'weekly',
      JSON.stringify([
        { topic: '맛집 추천', count: 15, sentiment: 'positive' },
        { topic: '육아 정보', count: 12, sentiment: 'neutral' },
        { topic: '운전면허', count: 8, sentiment: 'neutral' },
        { topic: '부동산', count: 10, sentiment: 'positive' }
      ]),
      JSON.stringify([
        { keyword: '달라스', count: 25 },
        { keyword: '플레이노', count: 18 },
        { keyword: '한식당', count: 15 },
        { keyword: '학교', count: 12 },
        { keyword: '병원', count: 8 }
      ]),
      JSON.stringify([])
    ]);
    
    console.log('✅ Inserted trending data');
    
    console.log('🎉 Community seed data inserted successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding community data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCommunityData().catch(console.error);