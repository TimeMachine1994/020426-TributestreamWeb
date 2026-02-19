import { json } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET({ url }) {
  const file = url.searchParams.get('file');
  
  if (!file) {
    return json({ error: 'File parameter required' }, { status: 400 });
  }
  
  // Security: Only allow specific files
  const allowedFiles = ['premtxt.txt', 'editprem.txt', 'officialtxt.txt'];
  if (!allowedFiles.includes(file)) {
    return json({ error: 'Invalid file' }, { status: 400 });
  }
  
  try {
    const filePath = join(process.cwd(), 'src', 'routes', 'tpg', file);
    const content = await readFile(filePath, 'utf-8');
    
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error loading sample file:', error);
    return json({ error: 'File not found' }, { status: 404 });
  }
}
