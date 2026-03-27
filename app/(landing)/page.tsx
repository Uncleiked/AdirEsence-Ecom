import { sanityFetch } from "@/sanity/lib/live";
import { HERO_QUERY, FEATURES_QUERY, ABOUT_QUERY } from "@/lib/sanity/queries/landing";
import { ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { HeroSection } from "@/components/blocks/HeroSection";
import { AboutSection } from "@/components/blocks/AboutSection";
import { LandingCategoryCarousel } from "@/components/blocks/LandingCategoryCarousel";
import { SequenceAnimation } from "@/components/SequenceAnimation";

export default async function LandingPage() {
  let heroData = null;
  let featuresData: any[] = [];
  let aboutData = null;
  let categories: any[] = [];

  try {
    const { data: hData } = await sanityFetch({ query: HERO_QUERY });
    heroData = hData;

    const { data: fData } = await sanityFetch({ query: FEATURES_QUERY });
    featuresData = fData || [];

    const { data: abtData } = await sanityFetch({ query: ABOUT_QUERY });
    aboutData = abtData;

    const { data: catData } = await sanityFetch({ query: ALL_CATEGORIES_QUERY });
    categories = catData || [];
  } catch (error) {
    console.error("Failed to fetch landing page data:", error);
  }

  const animationSequence = heroData?.animationSequence;

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* ── Parallax stacking container ── */}
      <div className="relative w-full overflow-clip">

        {/* Hero */}
        {animationSequence?.images && animationSequence.images.length > 0 ? (
          <div className="relative w-full z-0">
            <SequenceAnimation
              imageUrls={animationSequence.images}
              beatA={heroData?.beatA}
              beatB={heroData?.beatB}
              beatC={heroData?.beatC}
              beatD={heroData?.beatD}
            />
          </div>
        ) : (
          <div className="sticky top-0 h-screen w-full z-0 overflow-hidden">
            <HeroSection data={heroData} />
          </div>
        )}

        {/* About – slides over the hero with rounded top + shadow */}
        <div 
          className={`relative z-10 w-full rounded-t-[3rem] bg-zinc-50 dark:bg-black shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)] overflow-hidden ${
            animationSequence?.images?.length ? 'mt-[-100vh]' : 'mt-[-2rem]'
          }`}
        >
          <AboutSection data={aboutData} />
        </div>

        {/* Product Category */}
        <div className="relative z-10 w-full bg-white dark:bg-zinc-950">
          <LandingCategoryCarousel categories={categories} />
        </div>

        {/* Features – continues the overlap stack */}
        {featuresData && featuresData.length > 0 && (
          <div className="relative z-10 w-full bg-zinc-50 dark:bg-zinc-950">
            <section className="py-24 bg-zinc-50 dark:bg-zinc-950">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white dark:bg-black rounded-3xl p-10 md:p-20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.04)] border border-zinc-100 dark:border-zinc-900 transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                  <h3 className="text-3xl font-bold mb-12 text-zinc-900 dark:text-white tracking-tight">Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuresData.map((feature: any, idx: number) => (
                      <div key={idx} className="flex flex-col items-center text-center p-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                        {feature.icon ? (
                          <div className="w-12 h-12 mb-4 text-zinc-900 dark:text-white group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: feature.icon }} />
                        ) : (
                          <div className="w-12 h-12 mb-4 bg-zinc-200 dark:bg-zinc-800 rounded-full group-hover:scale-110 transition-transform" />
                        )}
                        <h4 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">{feature.title}</h4>
                        <p className="text-zinc-600 dark:text-zinc-400 font-light text-sm">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
