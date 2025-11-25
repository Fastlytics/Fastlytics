import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Navbar from "@/components/Navbar";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-pulse mb-8">
          <AlertCircle className="h-24 w-24 text-red-500" />
        </div>
        
        <div className="text-center max-w-md">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-100">Page Not Found</h2>
          
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved. 
            This section of the track is under construction.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline" 
              className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-200"
            >
              Go Back
            </Button>
            
            <Button 
              onClick={() => navigate("/dashboard")}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
        
        <div className="mt-16 flex gap-3">
          <div className="h-1 w-16 bg-red-600 rounded-full"></div>
          <div className="h-1 w-8 bg-red-800 rounded-full"></div>
          <div className="h-1 w-4 bg-red-900 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
