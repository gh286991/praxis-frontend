import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
  it('should merge multiple class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'active', false && 'hidden');
    expect(result).toBe('base active');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should dedupe conflicting classes
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should filter out falsy values', () => {
    const result = cn('valid', null, undefined, '', 'another');
    expect(result).toBe('valid another');
  });

  it('should handle object syntax', () => {
    const result = cn({ active: true, disabled: false });
    expect(result).toBe('active');
  });
});
