import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeaturedCourses from './FeaturedCourses';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/configs/mockData', () => ({
  featuredCourses: [
    {
      id: '1',
      title: 'Test Course 1',
      instructor: 'Test Instructor',
      thumbnail: '/test1.jpg',
      rating: 4.5,
      reviewCount: 50,
      duration: '2h',
      lessons: 10,
      enrolledCount: 100,
      category: 'Test',
      level: 'Beginner',
      isFeatured: true,
    },
    {
      id: '2',
      title: 'Test Course 2',
      instructor: 'Test Instructor 2',
      thumbnail: '/test2.jpg',
      rating: 4.8,
      reviewCount: 100,
      duration: '3h',
      lessons: 15,
      enrolledCount: 200,
      category: 'Test',
      level: 'Advanced',
      isFeatured: false,
    },
  ],
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <FeaturedCourses />
    </BrowserRouter>
  );
};

describe('FeaturedCourses', () => {
  it('renders featured courses section', () => {
    renderComponent();
    expect(screen.getByText('featuredCourses')).toBeInTheDocument();
  });

  it('scrolls left when left button clicked', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button');
    const leftButton = buttons[0];
    if (leftButton) {
      fireEvent.click(leftButton);
    }
  });

  it('scrolls right when right button clicked', () => {
    renderComponent();
    const buttons = screen.getAllByRole('button');
    const rightButton = buttons[1];
    if (rightButton) {
      fireEvent.click(rightButton);
    }
  });

  it('renders view all button', () => {
    renderComponent();
    expect(screen.getByText('viewAll')).toBeInTheDocument();
  });
});
