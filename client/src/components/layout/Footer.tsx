export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-xl text-white mb-4 font-ko">DFW Hanin</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            The premier directory and community portal for Korean-American businesses and residents in the Dallas-Fort Worth metroplex.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Directory</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Community News</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Events Calendar</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">For Businesses</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Add Your Business</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Claim Listing</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Advertising</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>info@dfwhanin.com</li>
            <li>(214) 555-0199</li>
            <li>Carrollton, TX 75007</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center">
        &copy; {new Date().getFullYear()} DFW Hanin. All rights reserved.
      </div>
    </footer>
  );
}