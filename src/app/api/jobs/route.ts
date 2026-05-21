import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
  const parsed = jobs.map(j => ({
    ...j,
    generatedJD: j.generatedJD ? JSON.parse(j.generatedJD) : null,
    matchRules: j.matchRules ? JSON.parse(j.matchRules) : null,
  }));
  return NextResponse.json(parsed);
}

export async function POST(req: Request) {
  const body = await req.json();
  const job = await prisma.job.create({
    data: {
      title: body.title,
      companyType: body.companyType || '',
      headcount: body.headcount || 1,
      responsibilities: body.responsibilities || '',
      requirements: body.requirements || '',
      city: body.city || '',
      industry: body.industry || '',
      generatedJD: body.generatedJD ? JSON.stringify(body.generatedJD) : null,
      matchRules: body.matchRules ? JSON.stringify(body.matchRules) : null,
    },
  });
  return NextResponse.json(job);
}
