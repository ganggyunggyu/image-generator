import { atom } from 'jotai';
import { ImageResult } from '@/shared/api/types';

export const searchQueryAtom = atom<string>('');

export const searchResultsAtom = atom<ImageResult[]>([]);

export const searchLoadingAtom = atom<boolean>(false);

export const searchErrorAtom = atom<string | null>(null);

export const totalResultsAtom = atom<string>('0');

export const selectedImagesAtom = atom<Set<number>>(new Set<number>());

export const bulkDownloadLoadingAtom = atom<boolean>(false);

export const downloadProgressAtom = atom<string>('');

export const imageCountAtom = atom<number>(50);

export const sortOrderAtom = atom<'original' | 'random'>('random');