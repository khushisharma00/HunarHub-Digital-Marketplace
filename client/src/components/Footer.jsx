import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShieldCheck, MapPin, Truck, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white">HunarHub</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Digital visibility and direct marketplace empowerment for local Indian micro-entrepreneurs: cobblers, potters, tailors, artisans, and small vendors.
            </p>
            <div className="flex items-center space-x-2 text-xs text-orange-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure COD, UPI & Card Payment Support</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Core Trades</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse?category=cobbler" className="hover:text-orange-400 transition-colors">
                  Traditional Cobblers & Leather
                </Link>
              </li>
              <li>
                <Link to="/browse?category=potter-kumhar" className="hover:text-orange-400 transition-colors">
                  Potters & Clay Cookware (Kumhar)
                </Link>
              </li>
              <li>
                <Link to="/browse?category=tailor" className="hover:text-orange-400 transition-colors">
                  Bespoke Tailors & Embroidery
                </Link>
              </li>
              <li>
                <Link to="/browse?category=artisan" className="hover:text-orange-400 transition-colors">
                  Handicraft Artisans & Woodcraft
                </Link>
              </li>
              <li>
                <Link to="/browse?category=small-vendor" className="hover:text-orange-400 transition-colors">
                  Local Small Vendors & Festive Decor
                </Link>
              </li>
            </ul>
          </div>

          {/* Major Artisan Hubs */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Artisan Hubs</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse?city=Jaipur" className="flex items-center space-x-1.5 hover:text-orange-400 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Jaipur, Rajasthan (Craft & Blue Pottery)</span>
                </Link>
              </li>
              <li>
                <Link to="/browse?city=Varanasi" className="flex items-center space-x-1.5 hover:text-orange-400 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Varanasi, UP (Terracotta & Brass)</span>
                </Link>
              </li>
              <li>
                <Link to="/browse?city=Lucknow" className="flex items-center space-x-1.5 hover:text-orange-400 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Lucknow, UP (Chikankari & Leather)</span>
                </Link>
              </li>
              <li>
                <Link to="/browse?city=Delhi" className="flex items-center space-x-1.5 hover:text-orange-400 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Delhi NCR (Chandni Chowk Artisans)</span>
                </Link>
              </li>
              <li>
                <Link to="/browse?city=Mumbai" className="flex items-center space-x-1.5 hover:text-orange-400 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span>Mumbai, MH (Spices & Herbal Crafts)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Help & Transparency */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Platform Values</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <Truck className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <span>Zero Advance Payment Risk: Customers pay cash or UPI directly when work is inspected.</span>
              </li>
              <li className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Admin Verified Profiles: Every registered micro-entrepreneur is verified before public listing.</span>
              </li>
              <li className="flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Fair Dispute Resolution: Dedicated dispute panel for grievance settlement.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} HunarHub. B.Tech Capstone Project. Empowering grassroots micro-entrepreneurs.</p>
          <div className="flex items-center space-x-1">
            <span>Built with pride for local Indian talent</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
