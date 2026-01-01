/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { encodeRoute, decodeRoute, RoutePayload } from '../router/routes';

describe('router/routes encode/decode', () => {
  it('should keep news activeTab when encoding/decoding', () => {
    const route: RoutePayload = { name: 'news', activeTab: 'announcement' };
    const encoded = encodeRoute(route);
    expect(encoded).toBe('news:announcement');
    const decoded = decodeRoute(encoded);
    expect(decoded).toEqual(route);
  });

  it('should decode legacy news-center', () => {
    expect(decodeRoute('news-center')).toEqual({ name: 'news' });
  });

  it('should preserve wallet source for hashrate-exchange', () => {
    const route: RoutePayload = { name: 'hashrate-exchange', source: 'reservation' };
    const encoded = encodeRoute(route);
    expect(encoded).toBe('wallet:hashrate_exchange:reservation');
    const decoded = decodeRoute(encoded);
    expect(decoded).toEqual(route);
  });

  it('should preserve wallet tab for asset-view', () => {
    const route: RoutePayload = { name: 'asset-view', tab: 2 };
    const encoded = encodeRoute(route);
    expect(encoded).toBe('asset-view:2');
    const decoded = decodeRoute(encoded);
    expect(decoded).toEqual(route);
  });

  it('should keep about-us source when from home', () => {
    const route: RoutePayload = { name: 'about-us', from: 'home' };
    const encoded = encodeRoute(route);
    expect(encoded).toBe('home:about-us');
    const decoded = decodeRoute(encoded);
    expect(decoded).toEqual(route);
  });

  it('should encode/decode balance-recharge with source and amount', () => {
    const route: RoutePayload = { name: 'balance-recharge', source: 'reservation', amount: '100' };
    const encoded = encodeRoute(route);
    expect(encoded).toBe('asset:balance-recharge:reservation:100');
    const decoded = decodeRoute(encoded);
    expect(decoded).toEqual(route);
  });
});

