import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  const where = jobId ? { jobId } : {};
  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { appliedAt: 'desc' },
    include: { evaluations: true },
  });

  const parsed = candidates.map(c => ({
    ...c,
    skills: JSON.parse(c.skills),
    projects: JSON.parse(c.projects),
    evaluations: c.evaluations.map(e => ({
      ...e,
      dimensions: JSON.parse(e.dimensions),
      strengths: JSON.parse(e.strengths),
      risks: JSON.parse(e.risks),
    })),
  }));

  return NextResponse.json(parsed);
}

export async function POST(req: Request) {
  const body = await req.json();
  const candidate = await prisma.candidate.create({
    data: {
      name: body.name,
      avatar: body.avatar || body.name?.charAt(0) || '?',
      phone: body.phone || '',
      email: body.email || '',
      age: body.age || 0,
      gender: body.gender || '',
      school: body.school || '',
      schoolTier: body.schoolTier || '双非',
      degree: body.degree || '本科',
      major: body.major || '',
      workYears: body.workYears || 0,
      currentCompany: body.currentCompany || '',
      currentTitle: body.currentTitle || '',
      jobHoppingCount: body.jobHoppingCount || 0,
      expectedSalary: body.expectedSalary || '',
      background: body.background || '',
      skills: JSON.stringify(body.skills || []),
      projects: JSON.stringify(body.projects || []),
      expectedPosition: body.expectedPosition || '',
      stage: body.stage || 'applied',
      resumeText: body.resumeText || null,
      resumeFileName: body.resumeFileName || null,
      jobId: body.jobId,
    },
  });

  return NextResponse.json({
    ...candidate,
    skills: JSON.parse(candidate.skills),
    projects: JSON.parse(candidate.projects),
  });
}
