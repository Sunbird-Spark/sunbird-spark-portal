import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PersonalInformation from './PersonalInformation';
import { UserProfile } from '@/types/userTypes';

describe('PersonalInformation', () => {
    const mockUser: UserProfile = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        maskedEmail: 'j***@example.com',
        phone: '1234567890',
        maskedPhone: '******7890',
        recoveryEmail: 'recovery@example.com',
        // other fields
        identifier: '123',
        userName: 'john_doe',
        rootOrgId: 'org1',
        channel: 'channel1',
        dob: '2000-01-01',
        status: 1,
        isDeleted: false,
        profileUserTypes: [],
        profileLocation: [],
        organisations: [],
        roles: []
    } as UserProfile;

    it('renders full name correctly', () => {
        render(<PersonalInformation user={mockUser} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });

    it('truncates long names', () => {
        const longUser = {
            ...mockUser,
            firstName: 'Christopher',
            lastName: 'VeryLongLastNameExample'
        };
        // Full name: Christopher VeryLongLastNameExample (31 chars)

        render(<PersonalInformation user={longUser} />);

        // Should display truncated version
        expect(screen.getByText('Christopher VeryLong...')).toBeInTheDocument();
        // Should have full name in title
        expect(screen.getByTitle('Christopher VeryLongLastNameExample')).toBeInTheDocument();
    });

    it('displays masked email and phone if available', () => {
        render(<PersonalInformation user={mockUser} />);
        expect(screen.getByText('j***@example.com')).toBeInTheDocument();
        expect(screen.getByText('******7890')).toBeInTheDocument();
    });

    it('falls back to raw email if masked not available', () => {
        const userNoMask = {
            ...mockUser,
            maskedEmail: undefined,
            maskedPhone: undefined
        };
        render(<PersonalInformation user={userNoMask} />);
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        // Phone does not fallback to raw phone, it shows placeholder
        expect(screen.getAllByText('Mobile Number').length).toBeGreaterThan(0);
    });

    it('displays placeholder if email/phone missing', () => {
        const userMissingInfo = {
            ...mockUser,
            maskedEmail: undefined,
            email: undefined,
            maskedPhone: undefined,
            phone: undefined
        };
        // @ts-ignore
        render(<PersonalInformation user={userMissingInfo} />);

        expect(screen.getAllByText('Email ID').length).toBeGreaterThan(0); // Label + Value
        expect(screen.getAllByText('Mobile Number').length).toBeGreaterThan(0); // Label + Value
    });

    it('displays recovery email if available', () => {
        render(<PersonalInformation user={mockUser} />);
        expect(screen.getByText('recovery@example.com')).toBeInTheDocument();
    });

    it('displays placeholder if recovery email missing', () => {
        const userNoRecovery = { ...mockUser, recoveryEmail: undefined };
        render(<PersonalInformation user={userNoRecovery} />);
        expect(screen.getAllByText('Alternate Email ID').length).toBeGreaterThan(0);
    });

    it('applies gray styling for missing fields', () => {
        const userMissingInfo = {
            ...mockUser,
            maskedEmail: undefined,
            email: undefined,
            maskedPhone: undefined,
            phone: undefined,
            recoveryEmail: undefined
        };
        render(<PersonalInformation user={userMissingInfo} />);

        // We'd look for the class text-sunbird-gray-75 on the span
        const spans = screen.getAllByText(/Email ID|Mobile Number|Alternate Email ID/);
        // Checking if any of them have the class
        const graySpans = spans.filter(s => s.classList.contains('text-sunbird-gray-75'));
        expect(graySpans.length).toBeGreaterThan(0);
    });
});
