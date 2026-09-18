import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Website index.html and style.css', () => {
  it('should have proper SEO, Tailwind CDN, and data-i18n tags', () => {
    const htmlPath = path.resolve(__dirname, '../../website/index.html');
    const cssPath = path.resolve(__dirname, '../../website/style.css');

    expect(fs.existsSync(htmlPath)).toBe(true);
    expect(fs.existsSync(cssPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('GitVista');
    expect(html).toContain('cdn.tailwindcss.com');
    expect(html).toContain('data-i18n="hero.title"');
    expect(html).toContain('data-i18n="nav.features"');
    expect(html).toContain('href="https://github.com/ndhphuc68/git-vista-"');
    expect(html).toContain('id="download-primary-btn"');
    expect(html).toContain('id="lang-toggle-btn"');
  });
});
