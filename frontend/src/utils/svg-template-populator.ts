const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDate = (dateStr: string, format: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return format
        .replace('DD', String(date.getDate()).padStart(2, '0'))
        .replace('MMMM', MONTHS[date.getMonth()] || '')
        .replace('YYYY', String(date.getFullYear()));
};

const resolveValue = (obj: any, path: string): any => path.split('.').reduce((curr, key) => curr?.[key], obj);

export const populateSvgTemplate = (svgString: string, userName: string, courseName: string, completionDate: string): string => {
    const data = {
        credentialSubject: { recipientName: userName, trainingName: courseName },
        issuanceDate: completionDate
    };

    return svgString
        .replace(/\{\{dateFormat\s+(\S+)\s+"([^"]+)"\}\}/g, (_, field, fmt) => {
            const value = resolveValue(data, field);
            return value ? formatDate(String(value), fmt) : '';
        })
        .replace(/\{\{([a-zA-Z_][\w.]*)\}\}/g, (_, path) => {
            const value = resolveValue(data, path);
            return value != null ? String(value) : '';
        });
};
