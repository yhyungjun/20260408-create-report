import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import UserMenu from '@/components/UserMenu';
import StartButton from '@/components/StartButton';

export default async function LandingPage() {
  const session = await auth();
  const user = session?.user
    ? { ...session.user, role: (session.user as { role?: string }).role }
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="조코딩 AX 파트너스"
              width={200}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          사전 기업 진단 컨설팅
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          AI가 기업의 디지털 전환 준비도를 진단하고,<br />
          맞춤형 AX(AI Transformation) 전략을 제안합니다.
        </p>
        <StartButton isLoggedIn={!!user} />
      </section>

      {/* 진행 절차 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">진행 절차</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: '결제',
                desc: '온라인 결제로\n간편하게 시작합니다.',
              },
              {
                step: '02',
                title: '사전 설문',
                desc: '기업 현황 파악을 위한 진단 설문을 작성합니다.',
              },
              {
                step: '03',
                title: '1:1 미팅',
                desc: '컨설턴트와 화상 미팅으로\n심층 진단합니다.',
              },
              {
                step: '04',
                title: '리포트 전달',
                desc: '컨설팅 후 완성된 8페이지\n기업 진단 리포트를\n이메일로 받습니다.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 포함 내용 */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">포함 내용</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'AI 성숙도 5대 영역 진단 (전략, 데이터, 프로세스, 인재, 기술)',
              'SWOT 분석 및 교차 전략 수립',
              'Gap 분석 (As-Is / To-Be)',
              'AX 혁신 과제 및 우선순위 매트릭스',
              '16주 실행 로드맵 및 Gantt 차트',
              'KPI 설정 및 성과 측정 프레임워크',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 푸터 */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-6 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">주식회사 조코딩에이엑스파트너스</p>
          <p>대표: 조동근, 문경원 | 사업자등록번호: 497-81-04077</p>

          <p>주소: 서울특별시 서초구 서초대로 397, B동 1401호(서초동, 부띠크 모나코)</p>
          <p>전화: 070-4280-6588 | 이메일: contact@jocodingax.ai</p>
          <div className="flex gap-3 mt-2">
            <a href="/terms" className="underline hover:text-gray-700">이용약관</a>
            <a href="/privacy" className="underline hover:text-gray-700">개인정보 처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
