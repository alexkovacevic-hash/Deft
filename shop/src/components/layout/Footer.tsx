import Link from "next/link";
import { ImageIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Photo<span className="text-teal-400">Shop</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Turn your favorite photos into beautiful, professionally printed
              products. Powered by Fujifilm.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/shop?category=prints" className="hover:text-teal-400 transition-colors">Prints & Posters</Link></li>
              <li><Link href="/shop?category=wall-decor" className="hover:text-teal-400 transition-colors">Wall Décor</Link></li>
              <li><Link href="/shop?category=albums-books" className="hover:text-teal-400 transition-colors">Photo Books</Link></li>
              <li><Link href="/shop?category=drinkware" className="hover:text-teal-400 transition-colors">Drinkware</Link></li>
              <li><Link href="/shop?category=home-office" className="hover:text-teal-400 transition-colors">Home & Office</Link></li>
              <li><Link href="/shop?category=textiles" className="hover:text-teal-400 transition-colors">Textiles</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/auth/signin" className="hover:text-teal-400 transition-colors">Sign In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-teal-400 transition-colors">Create Account</Link></li>
              <li><Link href="/gallery" className="hover:text-teal-400 transition-colors">My Gallery</Link></li>
              <li><Link href="/cart" className="hover:text-teal-400 transition-colors">Cart</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3 text-sm">
              <li><span className="hover:text-teal-400 transition-colors cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-teal-400 transition-colors cursor-pointer">Shipping Info</span></li>
              <li><span className="hover:text-teal-400 transition-colors cursor-pointer">Returns</span></li>
              <li><span className="hover:text-teal-400 transition-colors cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Fuji Photo Shop. All rights reserved.
            Powered by Fujifilm Personalized Photo Products Group.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="cursor-pointer hover:text-teal-400">Privacy Policy</span>
            <span className="cursor-pointer hover:text-teal-400">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
