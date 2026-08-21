import type { Coordinates } from '@/lib/api';

export function decodeGooglePolyline(encoded: string): Coordinates[] {
  const coordinates: Coordinates[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const latitudeResult = decodeValue(encoded, index);
    index = latitudeResult.nextIndex;
    latitude += latitudeResult.value;

    const longitudeResult = decodeValue(encoded, index);
    index = longitudeResult.nextIndex;
    longitude += longitudeResult.value;

    coordinates.push({
      latitude: latitude / 100000,
      longitude: longitude / 100000,
    });
  }

  return coordinates;
}

function decodeValue(encoded: string, startIndex: number) {
  let index = startIndex;
  let result = 0;
  let shift = 0;
  let byte: number;

  do {
    if (index >= encoded.length) {
      throw new Error('Google returned an invalid encoded route.');
    }

    byte = encoded.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    nextIndex: index,
    value: result & 1 ? ~(result >> 1) : result >> 1,
  };
}
