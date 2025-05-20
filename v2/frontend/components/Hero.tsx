'use client';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from '../styles/Hero.module.css';
import { useRouter } from 'next/navigation';

const Hero: React.FC = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/editor');
  };

  return (
    <div className={`${styles.heroContainer} hero-centered pt-4`}>
      <div className="max-w-lg">
        <h1 className={`${styles.heroTitle} mb-4`}>
          Learn to <br />code.
        </h1>
        <p className={`${styles.heroDescription} mb-8`}>
          Start your coding journey<br />
          with easy-to-follow tutorials<br />
          and examples.
        </p>
        <button 
          className={`${styles.heroButton} mt-2`} 
          onClick={handleGetStarted}
        >
          Get Started
          <ArrowRight className={styles.buttonIcon} />
        </button>
      </div>
    </div>
  );
};

export default Hero;