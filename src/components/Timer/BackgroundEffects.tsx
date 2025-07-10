import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { TimerStyleConfig } from '../../types/timerStyle';
import { getAdaptivePerformanceConfig, throttle } from '../../utils/performance';

interface BackgroundEffectsProps {
  style: TimerStyleConfig;
  isActive: boolean;
  className?: string;
}

const BackgroundEffects: React.FC<BackgroundEffectsProps> = React.memo(({
  style,
  isActive,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // 性能配置
  const performanceConfig = useMemo(() => getAdaptivePerformanceConfig(), []);

  // 优化后的样式配置
  const optimizedStyle = useMemo(() => ({
    ...style,
    particles: {
      ...style.particles,
      count: Math.min(style.particles.count, performanceConfig.particleCount),
      effect: performanceConfig.enableBackgroundEffects ? style.particles.effect : 'none'
    },
    background: {
      ...style.background,
      pattern: performanceConfig.enableBackgroundEffects ? style.background.pattern : 'none'
    },
    decoration: {
      ...style.decoration,
      element: performanceConfig.enableComplexDecorations ? style.decoration.element : 'none'
    }
  }), [style, performanceConfig]);

  // 粒子类定义
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    life: number;
    maxLife: number;

    constructor(canvas: HTMLCanvasElement, config: TimerStyleConfig['particles']) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = config.size + Math.random() * config.size;
      this.opacity = config.opacity;
      this.color = config.color;
      this.life = 0;
      this.maxLife = 100 + Math.random() * 100;

      // 根据粒子效果类型设置运动参数
      switch (config.effect) {
        case 'floating':
          this.vx = (Math.random() - 0.5) * config.speed * 0.5;
          this.vy = (Math.random() - 0.5) * config.speed * 0.5;
          break;
        case 'falling':
          this.vx = (Math.random() - 0.5) * config.speed * 0.2;
          this.vy = config.speed;
          break;
        case 'orbiting':
          this.vx = Math.cos(Math.random() * Math.PI * 2) * config.speed;
          this.vy = Math.sin(Math.random() * Math.PI * 2) * config.speed;
          break;
        case 'pulsing':
          this.vx = 0;
          this.vy = 0;
          break;
        case 'sparkling':
          this.vx = (Math.random() - 0.5) * config.speed * 2;
          this.vy = (Math.random() - 0.5) * config.speed * 2;
          break;
        default:
          this.vx = 0;
          this.vy = 0;
      }
    }

    update(canvas: HTMLCanvasElement, config: TimerStyleConfig['particles']) {
      this.life++;
      
      // 更新位置
      this.x += this.vx;
      this.y += this.vy;

      // 边界处理
      if (this.x < 0 || this.x > canvas.width) {
        if (config.effect === 'orbiting') {
          this.vx *= -1;
        } else {
          this.x = Math.random() * canvas.width;
        }
      }
      
      if (this.y < 0 || this.y > canvas.height) {
        if (config.effect === 'orbiting') {
          this.vy *= -1;
        } else {
          this.y = Math.random() * canvas.height;
        }
      }

      // 特殊效果处理
      if (config.effect === 'pulsing') {
        this.opacity = config.opacity * (0.5 + 0.5 * Math.sin(this.life * 0.1));
      } else if (config.effect === 'sparkling') {
        this.opacity = config.opacity * Math.random();
      }

      // 生命周期管理
      return this.life < this.maxLife;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 初始化粒子（使用优化后的样式）
  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || optimizedStyle.particles.effect === 'none') return;

    particlesRef.current = [];
    for (let i = 0; i < optimizedStyle.particles.count; i++) {
      particlesRef.current.push(new Particle(canvas, optimizedStyle.particles));
    }
  }, [optimizedStyle.particles]);

  // 动画循环（优化性能）
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || optimizedStyle.particles.effect === 'none') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 更新和绘制粒子
    particlesRef.current = particlesRef.current.filter(particle => {
      const alive = particle.update(canvas, optimizedStyle.particles);
      if (alive) {
        particle.draw(ctx);
      }
      return alive;
    });

    // 补充新粒子
    while (particlesRef.current.length < optimizedStyle.particles.count) {
      particlesRef.current.push(new Particle(canvas, optimizedStyle.particles));
    }

    if (isActive && performanceConfig.enableAnimations) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [optimizedStyle.particles, isActive, performanceConfig.enableAnimations]);

  // 调整画布尺寸
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  // 节流的resize处理函数
  const throttledResize = useMemo(
    () => throttle(() => {
      resizeCanvas();
      initParticles();
    }, 100),
    [resizeCanvas, initParticles]
  );

  useEffect(() => {
    resizeCanvas();
    initParticles();

    if (isActive && optimizedStyle.particles.effect !== 'none' && performanceConfig.enableAnimations) {
      animate();
    }

    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [optimizedStyle.particles, isActive, animate, initParticles, resizeCanvas, throttledResize, performanceConfig.enableAnimations]);

  // 生成背景图案的SVG（使用优化后的样式）
  const generateBackgroundPattern = useMemo(() => {
    const { pattern, color, size, opacity } = optimizedStyle.background;
    
    if (pattern === 'none') return null;

    const patternSize = size === 'small' ? 20 : size === 'medium' ? 40 : 60;
    const patternId = `pattern-${pattern}-${Date.now()}`;

    switch (pattern) {
      case 'dots':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
            <defs>
              <pattern id={patternId} x="0" y="0" width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
                <circle cx={patternSize/2} cy={patternSize/2} r="2" fill={color} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        );
      
      case 'grid':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
            <defs>
              <pattern id={patternId} x="0" y="0" width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
                <path d={`M ${patternSize} 0 L 0 0 0 ${patternSize}`} fill="none" stroke={color} strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        );
      
      case 'waves':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
            <defs>
              <pattern id={patternId} x="0" y="0" width={patternSize * 2} height={patternSize} patternUnits="userSpaceOnUse">
                <path 
                  d={`M 0 ${patternSize/2} Q ${patternSize/2} 0 ${patternSize} ${patternSize/2} T ${patternSize * 2} ${patternSize/2}`} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        );
      
      case 'geometric':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
            <defs>
              <pattern id={patternId} x="0" y="0" width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
                <polygon 
                  points={`${patternSize/2},5 ${patternSize-5},${patternSize/2} ${patternSize/2},${patternSize-5} 5,${patternSize/2}`} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        );
      
      case 'organic':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
            <defs>
              <pattern id={patternId} x="0" y="0" width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
                <circle cx={patternSize * 0.3} cy={patternSize * 0.3} r="3" fill={color} opacity="0.6" />
                <circle cx={patternSize * 0.7} cy={patternSize * 0.7} r="2" fill={color} opacity="0.4" />
                <circle cx={patternSize * 0.2} cy={patternSize * 0.8} r="1.5" fill={color} opacity="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        );
      
      case 'gradient':
        return (
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
              opacity
            }}
          />
        );
      
      default:
        return null;
    }
  }, [optimizedStyle.background]);

  // 生成装饰元素（使用优化后的样式）
  const generateDecoration = useMemo(() => {
    const { element, intensity, color, animated } = optimizedStyle.decoration;
    
    if (element === 'none') return null;

    const animationClass = animated ? 'animate-pulse' : '';

    switch (element) {
      case 'frame':
        return (
          <div 
            className={`absolute inset-0 border-2 rounded-lg pointer-events-none ${animationClass}`}
            style={{ 
              borderColor: color,
              opacity: intensity
            }}
          />
        );
      
      case 'corners':
        return (
          <div className="absolute inset-0 pointer-events-none">
            {[
              'top-0 left-0',
              'top-0 right-0',
              'bottom-0 left-0',
              'bottom-0 right-0'
            ].map((position, index) => (
              <div
                key={index}
                className={`absolute w-4 h-4 border-2 ${position} ${animationClass}`}
                style={{
                  borderColor: color,
                  opacity: intensity,
                  borderWidth: position.includes('top') ? '2px 0 0 2px' : 
                              position.includes('bottom') ? '0 0 2px 2px' : '2px'
                }}
              />
            ))}
          </div>
        );
      
      case 'glow':
        return (
          <div 
            className={`absolute inset-0 rounded-lg pointer-events-none ${animationClass}`}
            style={{
              boxShadow: `0 0 20px ${color}`,
              opacity: intensity
            }}
          />
        );
      
      case 'shadow':
        return (
          <div 
            className={`absolute inset-0 rounded-lg pointer-events-none ${animationClass}`}
            style={{
              boxShadow: `0 4px 20px ${color}`,
              opacity: intensity
            }}
          />
        );
      
      case 'border':
        return (
          <div 
            className={`absolute inset-0 border rounded-lg pointer-events-none ${animationClass}`}
            style={{
              borderColor: color,
              borderWidth: '1px',
              opacity: intensity
            }}
          />
        );
      
      default:
        return null;
    }
  }, [optimizedStyle.decoration]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* 背景图案 */}
      {generateBackgroundPattern}

      {/* 粒子效果画布 */}
      {optimizedStyle.particles.effect !== 'none' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* 装饰元素 */}
      {generateDecoration}
    </div>
  );
});

BackgroundEffects.displayName = 'BackgroundEffects';

export default BackgroundEffects;
