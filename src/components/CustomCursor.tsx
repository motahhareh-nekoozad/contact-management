import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const CustomCursor = () => {
  const heartRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heart = heartRef.current;
    const halo = haloRef.current;
    if (!heart || !halo) return;

    const updateCursorVisibility = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.body.style.cursor = 'auto';
      } else {
        document.body.style.cursor = 'none';
      }
    };

    updateCursorVisibility();
    window.addEventListener('resize', updateCursorVisibility);

    let lastX = 0;
    let lastY = 0;

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

    const createMobileClickBurst = (x: number, y: number) => {
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'fixed top-0 left-0 pointer-events-none z-50 text-brand-500 select-none';
        particle.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 drop-shadow-[0_0_8px_rgba(244,63,94,0.95)]">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        `;
        particle.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        document.body.appendChild(particle);

        // تولید برد پرتابی ۳۶۰ درجه
        const angle = (i / particleCount) * Math.PI * 2 + gsap.utils.random(-0.2, 0.2);
        const speed = gsap.utils.random(50, 110);
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;

        gsap.fromTo(particle,
          {
            scale: gsap.utils.random(0.7, 1.2), 
            opacity: 1,
            rotation: gsap.utils.random(-45, 45),
          },
          {
            x: `+=${dx}`,
            y: `+=${dy + gsap.utils.random(20, 50)}`, 
            scale: 0,
            opacity: 0,
            rotation: gsap.utils.random(-180, 180),
            duration: gsap.utils.random(0.7, 1.2),
            ease: 'power2.out',
            onComplete: () => {
              particle.remove();
            }
          }
        );
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;

      const { clientX: x, clientY: y } = e;

      gsap.to(heart, { x, y, duration: 0.08, ease: 'power2.out' });
      gsap.to(halo, { x, y, duration: 0.35, ease: 'power2.out' });

      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance > 20) {
        createHeartParticle(x, y);
        lastX = x;
        lastY = y;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (window.innerWidth < 768) {
        createMobileClickBurst(e.clientX, e.clientY);
      }
    };

    const onMouseOverInteractable = () => {
      if (window.innerWidth < 768) return;
      gsap.to(halo, { 
        scale: 1.5,
        backgroundColor: 'transparent',
        borderColor: 'rgba(244, 63, 94, 0.7)',
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
      if (window.innerWidth < 768) return;
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
    window.addEventListener('pointerdown', onPointerDown);

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
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', updateCursorVisibility);
      document.body.style.cursor = 'auto';
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={heartRef}
        className="hidden md:block fixed top-0 left-0 text-brand-500 pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 select-none"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5 drop-shadow-[0_0_5px_rgba(244,63,94,0.6)]"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      </div>

      <div
        ref={haloRef}
        className="hidden md:block fixed top-0 left-0 w-8 h-8 border border-brand-500/25 rounded-full pointer-events-none z-45 transform -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
};