import { format, isAfter, isThisWeek, isThisYear, isToday, isYesterday, subDays } from 'date-fns';
import { ja } from 'date-fns/locale/ja'
import type { ChatHistoryItem } from '~/lib/persistence';

type Bin = { category: string; items: ChatHistoryItem[] };

export function binDates(_list: ChatHistoryItem[]) {
  const list = _list.toSorted((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const binLookup: Record<string, Bin> = {};
  const bins: Array<Bin> = [];

  list.forEach((item) => {
    const category = dateCategory(new Date(item.timestamp));

    if (!(category in binLookup)) {
      const bin = {
        category,
        items: [item],
      };

      binLookup[category] = bin;

      bins.push(bin);
    } else {
      binLookup[category].items.push(item);
    }
  });

  return bins;
}

function dateCategory(date: Date) {
  if (isToday(date)) {
    return '今日';
  }

  if (isYesterday(date)) {
    return '昨日';
  }

  if (isThisWeek(date)) {
    // e.g., "Monday"
    return format(date, 'eeee', {locale: ja});
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  if (isAfter(date, thirtyDaysAgo)) {
    return '最後の30日';
  }

  if (isThisYear(date)) {
    // e.g., "July"
    return format(date, 'MMMM', {locale: ja});
  }

  // e.g., "July 2023"
  return format(date, 'MMMM yyyy', {locale: ja});
}
