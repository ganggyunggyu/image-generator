import { NextRequest, NextResponse } from 'next/server';
import { readS3TextFile, isS3Configured } from '@/shared/lib/s3';
import { getProductFolder, getDefaultFolder } from '@/shared/lib/product-keywords';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export interface ProductMetadata {
  mapQueries?: string[];
  phone?: string;
  url?: string;
}

interface ResponseBody {
  success: boolean;
  metadata: ProductMetadata | null;
  keyword: string;
  folder: string;
}

export async function GET(request: NextRequest) {
  try {
    if (!isS3Configured()) {
      return NextResponse.json(
        { error: 'S3가 설정되지 않았습니다' },
        { status: 500, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';

    const folderName = keyword ? getProductFolder(keyword) || getDefaultFolder() : getDefaultFolder();
    const metadataKey = `product-images/${folderName}/metadata.json`;

    console.log(`📄 메타데이터 조회: ${metadataKey}`);

    let metadata: ProductMetadata | null = null;

    try {
      const content = await readS3TextFile(metadataKey);
      metadata = JSON.parse(content);
      console.log(`✅ 메타데이터 파싱 완료:`, metadata);
    } catch {
      console.log(`⚠️ 메타데이터 없음 또는 파싱 실패: ${metadataKey}`);
    }

    const response: ResponseBody = {
      success: true,
      metadata,
      keyword: keyword || folderName,
      folder: folderName,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ product-metadata API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500, headers: corsHeaders }
    );
  }
}
