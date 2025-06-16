// src/app/api/predict/route.js

import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const fieldId = searchParams.get("fieldId");

  if (!userId || !fieldId) {
    return NextResponse.json({ error: "Lipsește userId sau fieldId" }, { status: 400 });
  }

  return new Promise((resolve) => {
    exec(`python predict.py ${userId} ${fieldId}`, (err, stdout, stderr) => {
      if (err) {
        console.error("Eroare exec predict.py:", stderr);
        return resolve(NextResponse.json({ error: "Eroare la rularea modelului" }, { status: 500 }));
      }

      try {
        const result = JSON.parse(stdout);
        return resolve(NextResponse.json(result));
      } catch (e) {
        console.error("Eroare la parsarea JSON din stdout:", stdout);
        return resolve(NextResponse.json({ error: "Output invalid de la model" }, { status: 500 }));
      }
    });
  });
}
