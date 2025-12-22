import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { LicenseKeyDisplay } from "@/components/LicenseKeyDisplay";

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { licenseKey, expiresAt, planName } = location.state || {};

  useEffect(() => {
    if (!licenseKey) {
      navigate('/');
    }
  }, [licenseKey, navigate]);

  if (!licenseKey) return null;

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <LicenseKeyDisplay 
            licenseKey={licenseKey}
            expiresAt={expiresAt}
            planName={planName}
          />
        </div>
      </main>
    </div>
  );
};

export default Success;
