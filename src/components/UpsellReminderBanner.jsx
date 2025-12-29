import React from 'react';
import { AlertCircle } from 'lucide-react';

export function UpsellReminderBanner({ reminders = [], location = 'cart' }) {
    // Filter reminders by location
    const activeReminders = reminders.filter(r =>
        r.isActive && (r.displayLocation === location || r.displayLocation === 'both')
    ).sort((a, b) => b.priority - a.priority);

    if (activeReminders.length === 0) return null;

    // Get highest priority reminder
    const reminder = activeReminders[0];

    // Parse reminder text and highlight keywords
    const parseText = (text) => {
        // Keywords to highlight in yellow/orange
        const keywords = [
            'Add Ons',
            'extra protein',
            'Would you like to make it a meal',
            'Coupons',
            'yes/no'
        ];

        let parts = [text];

        keywords.forEach(keyword => {
            const newParts = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    const regex = new RegExp(`(${keyword})`, 'gi');
                    const segments = part.split(regex);
                    segments.forEach((segment, i) => {
                        if (regex.test(segment)) {
                            newParts.push(
                                <span key={`${keyword}-${i}`} className="font-bold" style={{ color: reminder.highlightColor || '#fbbf24' }}>
                                    {segment}
                                </span>
                            );
                        } else if (segment) {
                            newParts.push(segment);
                        }
                    });
                } else {
                    newParts.push(part);
                }
            });
            parts = newParts;
        });

        return parts;
    };

    return (
        <div
            className="rounded-lg p-4 mb-4 shadow-lg border-2"
            style={{
                backgroundColor: reminder.backgroundColor || '#22c55e',
                borderColor: reminder.highlightColor || '#fbbf24',
                color: reminder.textColor || '#ffffff'
            }}
        >
            {/* Title */}
            <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5" style={{ color: reminder.highlightColor || '#fbbf24' }} />
                <h3 className="font-bold text-lg" style={{ color: reminder.highlightColor || '#fbbf24' }}>
                    {reminder.title}
                </h3>
            </div>

            {/* Reminder Items */}
            <ul className="space-y-2">
                {reminder.reminders.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span className="flex-1">
                            {parseText(item)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Default reminder configuration (can be customized per tenant)
export const DEFAULT_UPSELL_REMINDER = {
    title: "Proceed with care!!",
    reminders: [
        'If Customer opted for extra protein then go on "Add Ons" option.',
        'Ask for "Would you like to make it a meal" ?',
        'Check for Coupons to be redeemed yes/no ?'
    ],
    displayLocation: 'cart',
    isActive: true,
    backgroundColor: '#22c55e',
    textColor: '#ffffff',
    highlightColor: '#fbbf24',
    priority: 100
};
