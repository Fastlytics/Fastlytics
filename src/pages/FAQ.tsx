import React from 'react';
import Navbar from '@/components/Navbar'; // Assuming a standard Navbar
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components

const faqs = [
  {
    question: "What data sources does Fastlytics use?",
    answer: "Fastlytics primarily uses the FastF1 Python library, which accesses publicly available Formula 1 timing data, weather data, and session information. Data accuracy is dependent on these upstream sources.",
  },
  {
    question: "How often is the data updated?",
    answer: "Historical data (results, standings, charts) is pre-processed and cached by the backend script. The backend script needs to be run periodically to update historical data for completed events.",
  },
  {
    question: "Is Fastlytics affiliated with Formula 1?",
    answer: "No, Fastlytics is an independent project and is not affiliated with, endorsed by, or associated with Formula One group companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.",
  },
  {
    question: "Why is some data missing or unavailable?",
    answer: "Data availability depends on the upstream sources accessed by the FastF1 library. Sometimes, specific telemetry channels or historical data points might not be available for certain sessions or years. Additionally, the backend processor script must be run successfully to generate cached data.",
  },
  {
    question: "How can I report a bug or suggest a feature?",
    answer: "Please use the project's GitHub repository issue tracker.",
  },
  {
    question: "How is my account data secured?",
    answer: "We use Supabase for authentication and database management. Passwords are hashed, and we implement security measures to protect your data. Please refer to our Privacy Policy for more details.",
  },
];

const FAQ = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
         <Button
          variant="ghost"
          size="icon"
          className="absolute top-20 left-4 md:left-8 text-gray-300 hover:bg-gray-800 hover:text-white z-10"
          onClick={() => navigate(-1)} // Go back to previous page
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 text-white tracking-tight">Frequently Asked Questions</h1>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-gray-900/50 border border-gray-700/80 rounded-lg px-4 md:px-6 transition-colors hover:bg-gray-800/70"
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-medium hover:no-underline text-gray-100 py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 text-sm md:text-base pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
