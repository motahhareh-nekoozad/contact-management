import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const CustomCursor = () => {
  const heartRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heart = heartRef.current;
    const halo = haloRef.current;
    if (!heart || !halo) return;

    // پنهان کردن اشاره‌گر پیش‌فرض سیستم
    document.body.style.cursor = 'none';

    let lastX = 0;
    let lastY = 0;

    // تابع تولید ذرات ریز قلب در مسیر حرکت
    const createHeartParticle = (x: number, y: number) => {
      const particle = document.createElement('div');
      particle.className = 'fixed top-0 left-0 pointer-events-none z-40 text-brand-400 select-none';
      
      particle.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 drop-shadow-[0_0_4px_rgba(244,63,94,0.4)]">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      `;

      particle.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      document.body.appendChild(particle);

      gsap.fromTo(particle,
        {
          scale: gsap.utils.random(0.4, 0.7),
          opacity: 0.85,
          rotation: gsap.utils.random(-30, 30),
        },
        {
          xPercent: gsap.utils.random(-40, 40),
          yPercent: gsap.utils.random(30, 75),
          scale: 0,
          opacity: 0,
          rotation: gsap.utils.random(-90, 90),
          duration: gsap.utils.random(0.8, 1.3),
          ease: 'power2.out',
          onComplete: () => {
            particle.remove();
          }
        }
      );
    };

    const onMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;

      gsap.to(heart, { x, y, duration: 0.08, ease: 'power2.out' });
      gsap.to(halo, { x, y, duration: 0.35, ease: 'power2.out' });

      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance > 20) { // افزایش جزیی فاصله برای بهینه‌تر شدن تعداد ذرات
        createHeartParticle(x, y);
        lastX = x;
        lastY = y;
      }
    };

    // تعامل با هاور دکمه‌ها و لینک‌ها بدون تیره کردن یا مات کردن متن زیرین
    const onMouseOverInteractable = () => {
      gsap.to(halo, { 
        scale: 1.5, // اندازه منطقی‌تر و ظریف‌تر دور دکمه‌ها
        backgroundColor: 'transparent', // حذف رنگ پس‌زمینه برای حفظ خوانایی متن زیرین
        borderColor: 'rgba(244, 63, 94, 0.7)', // پررنگ‌تر شدن خط هاله برای بازخورد بهتر
        borderWidth: '1px',
        duration: 0.22 
      });
      gsap.to(heart, { 
        scale: 1.3, 
        rotation: 12,
        duration: 0.22 
      });
    };

    const onMouseLeaveInteractable = () => {
      gsap.to(halo, { 
        scale: 1, 
        backgroundColor: 'transparent', 
        borderColor: 'rgba(244, 63, 94, 0.25)', 
        borderWidth: '1px',
        duration: 0.22 
      });
      gsap.to(heart, { 
        scale: 1, 
        rotation: 0,
        duration: 0.22 
      });
    };

    window.addEventListener('mousemove', onMouseMove);

    const updateInteractables = () => {
      const interactables = document.querySelectorAll('button, [role="button"], a, input, select, textarea');
      interactables.forEach((el) => {
        el.addEventListener('mouseenter', onMouseOverInteractable);
        el.addEventListener('mouseleave', onMouseLeaveInteractable);
      });
    };

    updateInteractables();

    const observer = new MutationObserver(updateInteractables);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = 'auto';
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* قلب اصلی صورتی درخشان */}
      <div
        ref={heartRef}
        className="fixed top-0 left-0 text-brand-500 pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 select-none"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5 drop-shadow-[0_0_5px_rgba(244,63,94,0.6)]"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      </div>

      {/* هاله صورتی بیرونی (بدون افکت تار کننده برای وضوح ۱۰۰٪ متن‌ها) */}
      <div
        ref={haloRef}
        className="fixed top-0 left-0 w-8 h-8 border border-brand-500/25 rounded-full pointer-events-none z-45 transform -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
};