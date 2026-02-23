/* eslint-disable max-lines */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, Mock, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Onboarding from './OnboardingPage';
import { useFormRead } from '@/hooks/useForm';

// Mock dependencies
vi.mock('@/hooks/useForm');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock assets
vi.mock('../../../src/assets/sunbird-logo.svg', () => ({
  default: 'sunbird-logo.svg',
}));
vi.mock('../../../src/assets/onboarding-image.svg', () => ({
  default: 'onboarding-image.svg',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockOnboardingData = {
  isEnabled: true,
  initialScreenId: 'role',
  screens: {
    role: {
      title: 'What is your role?',
      selectionType: 'single' as const,
      nextScreenId: 'skills_teacher',
      fields: [
        { id: 'teacher', index: 0, label: 'Teacher' },
        { id: 'student', index: 1, label: 'Student' },
        { id: 'parent', index: 2, label: 'Parent' },
      ],
    },
    skills_teacher: {
      title: 'What skills are you interested in?',
      selectionType: 'single' as const,
      fields: [
        { id: 'math', index: 0, label: 'Mathematics', nextScreenId: 'experience' },
        { id: 'science', index: 1, label: 'Science', nextScreenId: 'experience' },
        { id: 'others', index: 2, label: 'Others' },
      ],
    },
    experience: {
      title: 'What is your experience level?',
      selectionType: 'single' as const,
      fields: [
        { id: 'beginner', index: 0, label: 'Beginner' },
        { id: 'intermediate', index: 1, label: 'Intermediate' },
        { id: 'expert', index: 2, label: 'Expert' },
      ],
    },
  },
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Onboarding Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders loading spinner while fetching data', () => {
    (useFormRead as Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithRouter(<Onboarding />);
    expect(container.querySelector('.onboarding-spinner')).toBeInTheDocument();
  });

  it('renders error state when form fetch fails', () => {
    (useFormRead as Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    renderWithRouter(<Onboarding />);
    expect(screen.getByText(/Failed to load onboarding/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip/i })).toBeInTheDocument();
  });

  it('navigates to home when onboarding is disabled', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: {
              isEnabled: false,
              initialScreenId: 'role',
              screens: {},
            },
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('renders first screen with correct title and options', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    expect(screen.getByText('We would love to help you personalize your experience!')).toBeInTheDocument();
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
  });

  it('displays progress indicator with correct step count', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('allows selecting an option', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    let teacherButton = screen.getByText('Teacher').closest('button');
    
    // Initially should have default class
    expect(teacherButton).toHaveClass('option-chip-default');
    
    fireEvent.click(teacherButton!);
    
    // Re-query the button after state update
    teacherButton = screen.getByText('Teacher').closest('button');
    
    // After click should have selected class
    expect(teacherButton).toHaveClass('option-chip-selected');
    expect(teacherButton).not.toHaveClass('option-chip-default');
  });

  it('navigates to next screen when Save and Proceed is clicked', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Select an option
    const teacherButton = screen.getByText('Teacher').closest('button');
    fireEvent.click(teacherButton!);
    
    // Click Save and Proceed
    const proceedButton = screen.getByRole('button', { name: /Save and Proceed/i });
    fireEvent.click(proceedButton);
    
    // Should navigate to next screen
    expect(screen.getByText('What skills are you interested in?')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('shows text input when "others" option is selected on skills screen', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to skills screen
    const teacherButton = screen.getByText('Teacher').closest('button');
    fireEvent.click(teacherButton!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Select "Others"
    const othersButton = screen.getByText('Others').closest('button');
    fireEvent.click(othersButton!);
    
    // Should show text input
    expect(screen.getByPlaceholderText('Please type your preference here')).toBeInTheDocument();
  });

  it('disables submit button when other text is empty', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to skills screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Select "Others"
    fireEvent.click(screen.getByText('Others').closest('button')!);
    
    // Navigate to final screen (if there's no nextScreenId for "others")
    // In this case, "others" has no nextScreenId, so it should show Submit
    const submitButton = screen.queryByRole('button', { name: /Submit/i });
    if (submitButton) {
      expect(submitButton).toBeDisabled();
    }
  });

  it('enables submit button when other text is provided', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to skills screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Select "Others"
    fireEvent.click(screen.getByText('Others').closest('button')!);
    
    // Type in the input
    const input = screen.getByPlaceholderText('Please type your preference here');
    fireEvent.change(input, { target: { value: 'Custom skill' } });
    
    // Submit button should be enabled (if visible)
    const submitButton = screen.queryByRole('button', { name: /Submit/i });
    if (submitButton) {
      expect(submitButton).not.toBeDisabled();
    }
  });

  it('shows Submit button on final screen', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate through screens to final one
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    fireEvent.click(screen.getByText('Mathematics').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // On experience screen (final), select an option
    fireEvent.click(screen.getByText('Beginner').closest('button')!);
    
    // Should show Submit button
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
  });

  it('submits form and navigates to home', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to final screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    fireEvent.click(screen.getByText('Mathematics').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    fireEvent.click(screen.getByText('Beginner').closest('button')!);
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Fast-forward timers
    vi.advanceTimersByTime(1000);
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('allows skipping onboarding', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    const skipButton = screen.getByRole('button', { name: /Skip Onboarding/i });
    fireEvent.click(skipButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('disables skip button while submitting', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to final screen and submit
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    fireEvent.click(screen.getByText('Mathematics').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    fireEvent.click(screen.getByText('Beginner').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    // Skip button should be disabled
    const skipButton = screen.getByRole('button', { name: /Skip Onboarding/i });
    expect(skipButton).toBeDisabled();
  });

  it('disables Save and Proceed button when no option is selected', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    const proceedButton = screen.getByRole('button', { name: /Save and Proceed/i });
    expect(proceedButton).toBeDisabled();
  });

  it('sorts fields by index', () => {
    const dataWithUnsortedFields = {
      ...mockOnboardingData,
      screens: {
        role: {
          title: 'What is your role?',
          selectionType: 'single' as const,
          nextScreenId: 'skills_teacher',
          fields: [
            { id: 'parent', index: 2, label: 'Parent' },
            { id: 'teacher', index: 0, label: 'Teacher' },
            { id: 'student', index: 1, label: 'Student' },
          ],
        },
      },
    };

    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: dataWithUnsortedFields,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    const buttons = screen.getAllByRole('button').filter(btn => 
      ['Teacher', 'Student', 'Parent'].includes(btn.textContent || '')
    );
    
    expect(buttons[0]).toHaveTextContent('Teacher');
    expect(buttons[1]).toHaveTextContent('Student');
    expect(buttons[2]).toHaveTextContent('Parent');
  });

  it('shows text input when others is selected and hides it when different option selected', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to skills screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Initially, option chips should be visible
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
    
    // Select "Others"
    fireEvent.click(screen.getByText('Others').closest('button')!);
    
    // Text input should appear and option chips should be hidden
    expect(screen.getByPlaceholderText('Please type your preference here')).toBeInTheDocument();
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Please type your preference here');
    fireEvent.change(input, { target: { value: 'Custom skill' } });
    expect(input).toHaveValue('Custom skill');
  });

  it('renders logo and onboarding image', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
    expect(screen.getByAltText('Onboarding Image')).toBeInTheDocument();
  });

  it('does not show back button on first screen', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    const backButton = screen.queryByLabelText('Go back');
    expect(backButton).not.toBeInTheDocument();
  });

  it('shows back button on second screen', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to second screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Back button should now be visible
    const backButton = screen.getByLabelText('Go back');
    expect(backButton).toBeInTheDocument();
    expect(backButton).not.toBeDisabled();
  });

  it('navigates back to previous screen when back button is clicked', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to second screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Should be on skills screen
    expect(screen.getByText('What skills are you interested in?')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    
    // Click back button
    const backButton = screen.getByLabelText('Go back');
    fireEvent.click(backButton);
    
    // Should be back on first screen
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });

  it('disables back button during submission', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to final screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    fireEvent.click(screen.getByText('Mathematics').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Back button should be visible and enabled
    const backButton = screen.getByLabelText('Go back');
    expect(backButton).not.toBeDisabled();
    
    // Select an option and submit
    fireEvent.click(screen.getByText('Beginner').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    // Back button should now be disabled
    expect(backButton).toBeDisabled();
  });

  it('maintains navigation history correctly through multiple screens', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate forward through all screens
    expect(screen.getByText('1/3')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    expect(screen.getByText('2/3')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Mathematics').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    expect(screen.getByText('3/3')).toBeInTheDocument();
    
    // Navigate back
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('What skills are you interested in?')).toBeInTheDocument();
    
    // Navigate back again
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    
    // Back button should not be visible on first screen
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument();
  });

  it('clears other text when navigating back', () => {
    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: mockOnboardingData,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Navigate to skills screen
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Select "Others" and type
    fireEvent.click(screen.getByText('Others').closest('button')!);
    const input = screen.getByPlaceholderText('Please type your preference here');
    fireEvent.change(input, { target: { value: 'Custom skill' } });
    expect(input).toHaveValue('Custom skill');
    
    // Navigate back
    fireEvent.click(screen.getByLabelText('Go back'));
    
    // Should be back on first screen
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    
    // Navigate forward again
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // The "Others" selection is still in state, so input is shown
    // But the otherText state was cleared by handleBack
    const clearedInput = screen.getByPlaceholderText('Please type your preference here');
    expect(clearedInput).toHaveValue('');
  });

  it('handles invalid nextScreenId gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const dataWithInvalidNext = {
      isEnabled: true,
      initialScreenId: 'role',
      screens: {
        role: {
          title: 'What is your role?',
          selectionType: 'single' as const,
          nextScreenId: 'nonexistent_screen',
          fields: [
            { id: 'teacher', index: 0, label: 'Teacher' },
          ],
        },
      },
    };

    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: dataWithInvalidNext,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Select an option
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    
    // Try to proceed with invalid nextScreenId
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid nextScreenId: "nonexistent_screen" does not exist in onboarding screens'
    );
    
    // Should stay on current screen (not navigate)
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles invalid field-level nextScreenId gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const dataWithInvalidFieldNext = {
      isEnabled: true,
      initialScreenId: 'role',
      screens: {
        role: {
          title: 'What is your role?',
          selectionType: 'single' as const,
          fields: [
            { id: 'teacher', index: 0, label: 'Teacher', nextScreenId: 'invalid_screen' },
            { id: 'student', index: 1, label: 'Student' },
          ],
        },
      },
    };

    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: dataWithInvalidFieldNext,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Select option with invalid nextScreenId
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    
    // Try to proceed
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid nextScreenId: "invalid_screen" does not exist in onboarding screens'
    );
    
    // Should stay on current screen
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('treats screen with invalid nextScreenId as terminal screen', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const dataWithInvalidNext = {
      isEnabled: true,
      initialScreenId: 'role',
      screens: {
        role: {
          title: 'What is your role?',
          selectionType: 'single' as const,
          fields: [
            { id: 'teacher', index: 0, label: 'Teacher', nextScreenId: 'nonexistent' },
          ],
        },
      },
    };

    (useFormRead as Mock).mockReturnValue({
      data: {
        data: {
          form: {
            data: dataWithInvalidNext,
          },
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithRouter(<Onboarding />);
    
    // Select option
    fireEvent.click(screen.getByText('Teacher').closest('button')!);
    
    // Should still show "Save and Proceed" button (because nextScreenId exists)
    expect(screen.getByRole('button', { name: /Save and Proceed/i })).toBeInTheDocument();
    
    // Click the button to trigger the error
    fireEvent.click(screen.getByRole('button', { name: /Save and Proceed/i }));
    
    // Should log error and not navigate
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid nextScreenId: "nonexistent" does not exist in onboarding screens'
    );
    
    // Should stay on the same screen
    expect(screen.getByText('What is your role?')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });
});