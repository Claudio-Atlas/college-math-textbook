/**
 * Brand logo component - text-based for now, can swap in images later
 */
import { useBrand } from './BrandProvider';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const { brand, isAtlas } = useBrand();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`font-serif font-bold ${sizeClasses[size]} ${className}`}>
      <span style={{ color: brand.colors.primary }}>
        {isAtlas ? (
          <>
            <span className="tracking-wide">ATLAS</span>
            <span className="font-normal text-gray-600 ml-1">Classical Press</span>
          </>
        ) : (
          <>
            <span className="tracking-wide">MERIDIAN</span>
            <span className="font-normal text-gray-600 ml-1">Press</span>
          </>
        )}
      </span>
    </div>
  );
}
