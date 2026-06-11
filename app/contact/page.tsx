import { StorefrontHeader } from '@/components/storefront/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Contact Us - DEECHOI LIMITED',
  description: 'Get in touch with DEECHOI LIMITED. Find our address, phone number, and email.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl opacity-90">
            We&apos;d love to hear from you. Get in touch with us today!
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">Get In Touch</h2>

              <div className="space-y-6">
                {/* Address */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Address</h3>
                    <p className="text-foreground/80">
                      Eze Nvuigwe Avenue<br />
                      Woji, Port Harcourt<br />
                      Rivers State, Nigeria
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Phone</h3>
                    <a
                      href="tel:+2347046145982"
                      className="text-primary hover:underline"
                    >
                      +234 704 614 5982
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Email</h3>
                    <a
                      href="mailto:deechoi01@gmail.com"
                      className="text-primary hover:underline"
                    >
                      deechoi01@gmail.com
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="bg-muted p-6 rounded-lg mt-8">
                  <h3 className="font-semibold text-foreground mb-3">Business Hours</h3>
                  <ul className="space-y-2 text-foreground/80">
                    <li>Monday - Friday: 9:00 AM - 8:00 PM</li>
                    <li>Saturday: 10:00 AM - 9:00 PM</li>
                    <li>Sunday: 12:00 PM - 7:00 PM</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">Send us a Message</h2>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject
                  </label>
                  <Input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <Textarea
                    placeholder="Your message..."
                    rows={5}
                    className="w-full"
                  />
                </div>

                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Send Message
                </Button>
              </form>

              <p className="text-sm text-foreground/60 mt-4 text-center">
                We typically respond within 24 hours
              </p>
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
