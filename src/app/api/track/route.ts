import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '@/lib/db';

async function fetchDataDariInternet(queryDinamis: string) {
    let semuaHasil: any[] = [];
    
    for (let page = 0; page < 5; page++) {
        let bCode = (page * 10) + 1;
        try {
            const urlPencarian = `https://search.yahoo.com/search?p=${encodeURIComponent(queryDinamis)}&b=${bCode}`;
            
            const response = await axios.get(urlPencarian, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            let adaHasil = false;

            $('h3 a, .compTitle a, .algo a, .Sr a').each((i, el) => {
                const title = $(el).text().trim();
                let urlAsli = $(el).attr('href');
                
                const container = $(el).closest('.dd, .algo, .Sr, li');
                const snip = container.find('.compText, .s, p').text().trim() || container.text().trim();
                
                if(urlAsli && urlAsli.includes('RU=')) {
                    try {
                        const match = urlAsli.match(/RU=([^/]+)/);
                        if(match) urlAsli = decodeURIComponent(match[1]);
                    } catch(err) {}
                }

                if (title && title.length > 5 && !title.toLowerCase().includes('searches related')) {
                    semuaHasil.push({
                        sinyal_nama: title + " " + snip, 
                        sinyal_pekerjaan: snip, 
                        sinyal_afiliasi: snip, 
                        sinyal_tahun: snip,
                        sumber: title.substring(0, 100),
                        link: urlAsli || "Link Disembunyikan"
                    });
                    adaHasil = true;
                }
            });

            if (!adaHasil) break;
            await new Promise(res => setTimeout(res, 1000));

        } catch (error: any) {
            break;
        }
    }
    
    return semuaHasil;
}

function hitungBobotKecocokan(targetMaster: any, kandidatInternet: any) {
    let totalSkor = 0;
    let matchNama = 0;
    
    const namaMaster = targetMaster.namaLengkap.toLowerCase();
    const namaPisah = namaMaster.split(" ");
    const teksTerkumpul = (kandidatInternet.sinyal_nama + " " + kandidatInternet.sinyal_pekerjaan).toLowerCase();

    if (teksTerkumpul.includes(namaMaster)) {
        matchNama = 60;
    } else {
        let kataCocok = 0;
        namaPisah.forEach((kata: string) => {
            if (kata.length > 2 && teksTerkumpul.includes(kata)) {
                kataCocok++;
            }
        });
        if (kataCocok > 0) {
            matchNama = Math.floor((kataCocok / namaPisah.length) * 60);
        }
    }
    totalSkor += matchNama;
    
    const namaKampus = targetMaster.kampus.toLowerCase();
    const regexKampus = new RegExp(`(${namaKampus}|umm|muhammadiyah malang|universitas muhammadiyah)`, "i");
    if (regexKampus.test(teksTerkumpul)) {
        totalSkor += 40;
    }
    
    const regexProdi = new RegExp(targetMaster.prodi.toLowerCase().split(" ")[0], "i");
    const regexUmum = new RegExp("(engineer|developer|software|analyst|dokter|dosen|guru|student|mahasiswa|lulusan|alumni)", "i");
    if (regexProdi.test(teksTerkumpul) || regexUmum.test(teksTerkumpul)) {
        totalSkor += 20;
    }

    return { totalSkor, matchNama };
}

export async function POST(req: Request) {
    try {
        const daftarAlumni = db.prepare("SELECT * FROM Alumni WHERE status = 'Belum Dilacak'").all();

        if (daftarAlumni.length === 0) {
            return NextResponse.json({ sukses: true, pesan: "Tidak ada target yang perlu dilacak saat ini." });
        }

        for (let i = 0; i < daftarAlumni.length; i++) {
            const target: any = daftarAlumni[i];

            let queryTahap1 = `"${target.namaLengkap}" ${target.kampus} (site:linkedin.com OR site:scholar.google.com OR site:researchgate.net OR site:instagram.com OR site:facebook.com OR site:sinta.kemdikbud.go.id OR site:github.com)`;
            let hasilJejakInternet = await fetchDataDariInternet(queryTahap1);
            
            let kandidatTerbaik: any = null;
            let skorTertinggi = 0;
            let kandidatPotensial: any[] = [];

            for (const hasil of hasilJejakInternet) {
                const { totalSkor: skorSkrg, matchNama } = hitungBobotKecocokan(target, hasil);
                if (matchNama >= 20 && skorSkrg >= 40) {
                    kandidatPotensial.push({ ...hasil, skorAsli: skorSkrg });
                }
                if (skorSkrg > skorTertinggi) {
                    skorTertinggi = skorSkrg;
                    kandidatTerbaik = hasil;
                }
            }

            if (skorTertinggi < 80) {
                let queryTahap2 = `${target.namaLengkap} ${target.kampus} (linkedin OR google scholar OR researchgate OR instagram OR facebook OR sinta OR github)`;
                let hasilJejakLonggar = await fetchDataDariInternet(queryTahap2);
                
                for (const hasil of hasilJejakLonggar) {
                    const { totalSkor: skorSkrg, matchNama } = hitungBobotKecocokan(target, hasil);
                    if (matchNama >= 20 && skorSkrg >= 40) {
                        kandidatPotensial.push({ ...hasil, skorAsli: skorSkrg });
                    }
                    if (skorSkrg > skorTertinggi) {
                        skorTertinggi = skorSkrg;
                        kandidatTerbaik = hasil;
                    }
                }
            }

            {
                let queryTahap3 = `"${target.namaLengkap}" ${target.prodi}`;
                let hasilJejakArtikel = await fetchDataDariInternet(queryTahap3);
                
                for (const hasil of hasilJejakArtikel) {
                    const { totalSkor: skorSkrg, matchNama } = hitungBobotKecocokan(target, hasil);
                    if (matchNama >= 60) {
                        kandidatPotensial.push({ ...hasil, skorAsli: skorSkrg || 45 });
                    }
                    if (skorSkrg > skorTertinggi) {
                        skorTertinggi = skorSkrg;
                        kandidatTerbaik = hasil; 
                    }
                }
            }

            const unikKandidatSet = new Set();
            const kandidatPotensialUnik = kandidatPotensial.filter(pot => {
                if(!unikKandidatSet.has(pot.link)) {
                    unikKandidatSet.add(pot.link);
                    return true;
                }
                return false;
            }).sort((a, b) => b.skorAsli - a.skorAsli);

            let statusAkhir = 'Belum Dilacak';

            if (kandidatTerbaik) {
                let keteranganMaster = "";
                let tahunDiperbarui = target.tahunLulus;

                if (!tahunDiperbarui || tahunDiperbarui === "" || tahunDiperbarui === "-") {
                    const teksBukti = kandidatTerbaik.sinyal_nama + " " + kandidatTerbaik.sinyal_pekerjaan;
                    const matchTahun = teksBukti.match(/\b(19|20)\d{2}\b/);
                    if (matchTahun) {
                        tahunDiperbarui = matchTahun[0];
                    }
                }

                const namaKampus = target.kampus.toLowerCase();
                const regexKampusCheck = new RegExp(`(${namaKampus}|umm|muhammadiyah malang|universitas muhammadiyah)`, "i");

                let jumlahKokohNamaKampus = 0;
                for (const pot of kandidatPotensialUnik) {
                    const teksPot = (pot.sinyal_nama + " " + pot.sinyal_pekerjaan).toLowerCase();
                    const namaUtuhCocok = teksPot.includes(target.namaLengkap.toLowerCase());
                    const kampusCocok = regexKampusCheck.test(teksPot);
                    if (namaUtuhCocok && kampusCocok) {
                        jumlahKokohNamaKampus++;
                    }
                }

                const totalKandidat = kandidatPotensialUnik.length;
                const persenKokoh = totalKandidat > 0 ? (jumlahKokohNamaKampus / totalKandidat) * 100 : 0;

                if (persenKokoh > 70 && jumlahKokohNamaKampus >= 1) {
                    statusAkhir = 'Teridentifikasi dari sumber publik';
                    keteranganMaster = kandidatTerbaik.sinyal_pekerjaan;
                    db.prepare("UPDATE Alumni SET status = ?, ringkasanAktivitas = ?, tahunLulus = ?, lastUpdateSearch = CURRENT_TIMESTAMP WHERE id = ?")
                      .run(statusAkhir, keteranganMaster, tahunDiperbarui, target.id);

                } else if (persenKokoh > 0 || skorTertinggi >= 50) {
                    statusAkhir = 'Perlu Verifikasi Manual';
                    keteranganMaster = kandidatTerbaik.sinyal_pekerjaan;
                    db.prepare("UPDATE Alumni SET status = ?, ringkasanAktivitas = ?, tahunLulus = ?, lastUpdateSearch = CURRENT_TIMESTAMP WHERE id = ?")
                      .run(statusAkhir, keteranganMaster, tahunDiperbarui, target.id);

                } else {
                    statusAkhir = 'Belum ditemukan di sumber publik';
                    db.prepare("UPDATE Alumni SET status = ?, lastUpdateSearch = CURRENT_TIMESTAMP WHERE id = ?")
                      .run(statusAkhir, target.id);
                }

                for (const pot of kandidatPotensialUnik) {
                    let ketLog = `Ditemukan dengan keyakinan ${pot.skorAsli}%. Teks Bukti: ${pot.sinyal_pekerjaan.substring(0, 100)}...`;
                    db.prepare(`INSERT INTO JejakBukti (alumniId, sumberTemuan, confidenceScore, pointerBukti, ringkasanInfo) 
                            VALUES (?, ?, ?, ?, ?)`)
                      .run(target.id, pot.sumber, pot.skorAsli, pot.link, ketLog);
                }

            } else {
                 db.prepare("UPDATE Alumni SET status = 'Belum ditemukan di sumber publik', lastUpdateSearch = CURRENT_TIMESTAMP WHERE id = ?").run(target.id);
            }
        } 

        return NextResponse.json({ sukses: true, pesan: "Berhasil menjalankan siklus pelacakan Yahoo Search." });

    } catch (error: any) {
        return NextResponse.json({ sukses: false, error: error.message }, { status: 500 });
    }
}
