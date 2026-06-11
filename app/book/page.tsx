import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Users, Clock, Utensils } from 'lucide-react'

export const metadata = {
  title: 'Book Us - DEECHOI LIMITED',
  description: 'Book DEECHOI LIMITED for your special events and occasions.',
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book DEECHOI for Your Event</h1>
          <p className="text-lg md:text-xl opacity-90">
            Bring authentic flavors to your special occasions
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="bg-muted p-6 rounded-lg text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Flexible Dates</h3>
              <p className="text-sm text-foreground/80">
                We accommodate events of all sizes and dates
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Any Size</h3>
              <p className="text-sm text-foreground/80">
                From intimate gatherings to large celebrations
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg text-center">
              <Utensils className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Custom Menu</h3>
              <p className="text-sm text-foreground/80">
                Personalized menu options tailored to your needs
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Professional Service</h3>
              <p className="text-sm text-foreground/80">
                Timely delivery and professional presentation
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Our Event Services
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-2xl font-bold text-primary mb-4">Popular Packages</h3>
                <ul className="space-y-3 text-foreground/80">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Sandwiches & Light Bites
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Small Chops Assortment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Grilled Chicken Wings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Full Meal Platters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Sausage Rolls & Pastries
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Lucky Packs (Surprise Combos)
                  </li>
                </ul>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-2xl font-bold text-primary mb-4">Event Types</h3>
                <ul className="space-y-3 text-foreground/80">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Birthday Parties
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Weddings & Receptions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Corporate Events
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Family Gatherings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Church & Community Events
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full"></span>
                    Holiday Celebrations
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-muted p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-foreground mb-8">Request a Booking</h2>

            <form className="space-y-6 max-w-3xl">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+234 XXX XXX XXXX"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Date *
                  </label>
                  <Input
                    type="date"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Type *
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                    <option>Select an event type</option>
                    <option>Birthday Party</option>
                    <option>Wedding</option>
                    <option>Corporate Event</option>
                    <option>Family Gathering</option>
                    <option>Church Event</option>
                    <option>Holiday Celebration</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Guests *
                  </label>
                  <Input
                    type="number"
                    placeholder="Number of guests"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Location/Venue *
                </label>
                <Input
                  type="text"
                  placeholder="Where is your event?"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Special Requests & Menu Preferences
                </label>
                <Textarea
                  placeholder="Tell us about your preferences, dietary restrictions, or any special requests..."
                  rows={5}
                  className="w-full"
                />
              </div>

              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-base">
                Request Booking
              </Button>

              <p className="text-sm text-foreground/60 text-center">
                We will contact you within 24 hours to confirm availability and discuss pricing
              </p>
            </form>
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
