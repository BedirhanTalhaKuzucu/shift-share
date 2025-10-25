export function fmt(dt: string) {
  try {
    const d = new Date(dt);
    const isValid = !isNaN(d.getTime());
    return isValid ? d.toLocaleString() : dt;
  } catch {
    return dt;
  }
}

export function formatDate(dt: string) {
  try {
    const d = new Date(dt);
    const isValid = !isNaN(d.getTime());
    if (!isValid) return dt;
    
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const dayName = days[d.getDay()];
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${dayName}, ${day}.${month}.${year}`;
  } catch {
    return dt;
  }
}

export function formatTime(dt: string) {
  try {
    const d = new Date(dt);
    const isValid = !isNaN(d.getTime());
    if (!isValid) return dt;
    
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch {
    return dt;
  }
}

export function calculateDuration(startDt: string, endDt: string) {
  try {
    const start = new Date(startDt);
    const end = new Date(endDt);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `(${diffHours} Std. ${diffMinutes.toString().padStart(2, '0')} Min.)`;
  } catch {
    return '';
  }
}
