export function formatDate(date: Date | { seconds: number; nanoseconds: number } | null): string {
    if (!date) return '';

    // Convert Firestore Timestamp to Date if needed
    const dateObj = 'seconds' in date ? new Date(date.seconds * 1000) : date;

    // Get time difference in milliseconds
    const diff = Date.now() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else if (days < 7) {
        return `${days}d ago`;
    } else {
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
} 