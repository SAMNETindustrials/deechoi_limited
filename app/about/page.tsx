import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'About Us - DEECHOI LIMITED',
  description: 'Learn about DEECHOI LIMITED, your trusted source for authentic cooked meals and snacks.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About DEECHOI LIMITED</h1>
          <p className="text-lg md:text-xl opacity-90">
            Your trusted partner in authentic, delicious cuisine
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Mission */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-lg text-foreground/80 leading-relaxed">
                At DEECHOI LIMITED, we are passionate about bringing authentic, mouth-watering Nigerian and West African cuisine to your table. Our mission is to prepare fresh, high-quality cooked meals and snacks that celebrate tradition while embracing modern culinary excellence. We believe food is more than nourishment—it&apos;s a celebration of culture, community, and care.
              </p>
            </div>

            {/* Values */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Values</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-primary mb-3">Quality</h3>
                  <p className="text-foreground/80">
                    We source the finest ingredients and prepare every meal with meticulous attention to detail and hygiene standards.
                  </p>
                </div>
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-primary mb-3">Authenticity</h3>
                  <p className="text-foreground/80">
                    Our recipes honor traditional cooking methods while delivering the authentic flavors our customers love.
                  </p>
                </div>
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-primary mb-3">Care</h3>
                  <p className="text-foreground/80">
                    Every meal is prepared with love and care, ensuring customer satisfaction is our top priority.
                  </p>
                </div>
              </div>
            </div>

            {/* Story */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Story</h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-4">
                DEECHOI LIMITED started as a passion project to bring the authentic taste of home to people who value quality, tradition, and genuine flavor. From humble beginnings, we&apos;ve grown into a trusted name for delicious, freshly-cooked meals and snacks.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Today, we continue to serve our community with the same dedication and passion that started it all. Whether you&apos;re ordering for a quick meal or booking us for your special event, we&apos;re committed to making every experience memorable.
              </p>
            </div>

            {/* CTA */}
            <div className="bg-primary text-primary-foreground p-8 rounded-lg text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Experience Our Cuisine?</h3>
              <p className="text-lg mb-6 opacity-90">
                Explore our menu and place your order today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="secondary" size="lg">
                    View Our Menu
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 DEECHOI LIMITED. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
