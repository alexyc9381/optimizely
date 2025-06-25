import { StorageInterface } from '../types';
export declare class Storage implements StorageInterface {
    private _prefix;
    private _fallback;
    constructor(prefix?: string);
    get(key: string): string | null;
    set(key: string, value: string, expiry?: number): void;
    remove(key: string): void;
    clear(): void;
    private _isNotExpired;
    private _getAllKeys;
    private _getCookie;
    private _setCookie;
    private _deleteCookie;
}
//# sourceMappingURL=Storage.d.ts.map