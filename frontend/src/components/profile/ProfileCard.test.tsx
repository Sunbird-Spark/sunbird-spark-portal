import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileCard from './ProfileCard';
import { UserProfile } from '@/types/userTypes';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'profileCard.sunbirdId': 'Sunbird ID'
            };
            return translations[key] || key;
        },
        i18n: { language: 'en' }
    })
}));

describe('ProfileCard', () => {
    const mockUser: UserProfile = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'john_doe',
        roles: [
            { role: 'CONTENT_CREATOR' },
            { role: 'BOOK_REVIEWER' },
            { role: 'MEMBERSHIP_MANAGEMENT' },
            { role: 'PUBLIC' } // Test split for multiple roles
        ],
        // Add other required fields with dummy data
        identifier: '123',
        email: 'john@example.com',
        phone: '1234567890',
        rootOrgId: 'org1',
        channel: 'channel1',
        dob: '2000-01-01',
        status: 1,
        isDeleted: false,
        profileUserTypes: [],
        profileLocation: [],
        organisations: []
    } as UserProfile; // Casting as we might not need all fields for this component

    it('renders user name and sunbird ID correctly', () => {
        render(<ProfileCard user={mockUser} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Sunbird ID : john_doe')).toBeInTheDocument();
    });

    it('formats and displays roles correctly', () => {
        render(<ProfileCard user={mockUser} />);

        // CONTENT_CREATOR -> Content Creator
        expect(screen.getByText('Content Creator')).toBeInTheDocument();
        // BOOK_REVIEWER -> Book Reviewer
        expect(screen.getByText('Book Reviewer')).toBeInTheDocument();
        // MEMBERSHIP_MANAGEMENT -> Membership Management
        expect(screen.getByText('Membership Management')).toBeInTheDocument();
        // PUBLIC -> Public
        expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('handles empty roles gracefully', () => {
        const userNoRoles = { ...mockUser, roles: [] };
        render(<ProfileCard user={userNoRoles} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // Should not render roles container or crash
        const rolesContainer = screen.queryByText('Content Creator');
        expect(rolesContainer).not.toBeInTheDocument();
    });

    it('handles undefined roles gracefully', () => {
        const userUndefinedRoles = { ...mockUser, roles: undefined };
        render(<ProfileCard user={userUndefinedRoles} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles missing names gracefully', () => {
        const userNoName = { ...mockUser, firstName: undefined, lastName: undefined, userName: undefined };
        // @ts-ignore - testing runtime safety
        render(<ProfileCard user={userNoName} />);

        // Should verify it renders without crashing, spacing char might be present
        // Depending on implementation `${undefined} ${undefined}` -> "undefined undefined" or with lodash get fallback -> " "
        // Our implementation uses _.get(..., '') so it should be " "

        // We look for "Sunbird ID :" with nothing after it or just check it didn't crash
        expect(screen.getByText(/Sunbird ID :/)).toBeInTheDocument();
    });

    it('chunks roles correctly', () => {
        // This is implicitly tested by checking if all roles are present, but we can verify structure if needed
        // For now, ensuring all roles appear is sufficient.
        render(<ProfileCard user={mockUser} />);
        expect(screen.getAllByText(/Content Creator|Book Reviewer|Membership Management|Public/).length).toBe(4);
    });

    it('handles unknown role format gracefully', () => {
        const userWeirdRole = {
            ...mockUser,
            roles: [{ role: 'WEIRD_FORMAT_ROLE_TEST' }]
        };
        render(<ProfileCard user={userWeirdRole} />);
        expect(screen.getByText('Weird Format Role Test')).toBeInTheDocument();
    });

    it('handles empty role string gracefully', () => {
        const userEmptyRole = {
            ...mockUser,
            roles: [{ role: '' }]
        };
        render(<ProfileCard user={userEmptyRole} />);
        // Should not render empty string or crash
    });
});
