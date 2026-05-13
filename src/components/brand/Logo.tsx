/**
 * Logo — single-brand "College Mathematics" wordmark.
 */
interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
    const sizeClasses = {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    return (
        <div className={`font-serif font-bold ${sizeClasses[size]} ${className}`}>
            <span className="tracking-wide" style={{ color: '#a78bfa' }}>COLLEGE</span>
            <span className="font-normal ml-1" style={{ color: 'var(--ax-text-secondary)' }}>Mathematics</span>
        </div>
    );
}
