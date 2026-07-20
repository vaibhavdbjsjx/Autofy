import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function animateFadeUp(selector: string) {
  gsap.fromTo(
    selector,
    { y: 60, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: selector,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    }
  );
}

export function animateScaleIn(selector: string) {
  gsap.fromTo(
    selector,
    { scale: 0.88, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.7,
      ease: 'back.out(1.4)',
      stagger: 0.1,
      scrollTrigger: {
        trigger: selector,
        start: 'top 80%',
      },
    }
  );
}
