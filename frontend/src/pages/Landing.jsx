import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Upload, Brain, Target, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/upload');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <MessageSquare className="w-20 h-20 text-primary-600" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Ace Your Next
            <span className="text-primary-600"> Interview</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Practice with AI-powered interview simulations tailored to your resume and job description. Get instant feedback and improve your skills.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-lg hover:bg-gray-50 transition-all border-2 border-primary-600"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 animate-slide-up">
          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Upload className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
            <p className="text-gray-600">
              Upload your resume and job description. Our AI analyzes them to create personalized questions.
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Brain className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Interview Coach</h3>
            <p className="text-gray-600">
              Practice with intelligent questions generated from real job requirements using advanced RAG technology.
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Target className="w-12 h-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Instant Feedback</h3>
            <p className="text-gray-600">
              Receive detailed scores and feedback on your answers with relevant citations from your documents.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-md">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Sign Up & Upload</h3>
                <p className="text-gray-600">Create an account and upload your resume and the job description you're targeting.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-md">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Start Interview</h3>
                <p className="text-gray-600">Our AI generates relevant interview questions based on the job requirements and your background.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-md">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Practice & Improve</h3>
                <p className="text-gray-600">Answer questions and get instant feedback with scores and suggestions for improvement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 InterviewPrep AI. Built for interview excellence.</p>
        </div>
      </footer>
    </div>
  );
}