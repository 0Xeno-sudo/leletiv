"""Create a text-layer PDF fixture; no patient data or medical finding is used."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

target = Path(__file__).resolve().parent.parent / 'test-fixtures' / 'synthetic-report.pdf'
pdf = canvas.Canvas(str(target), pagesize=(595, 842))
for page, date, measurement in [(1, '2026-08-01', '12'), (2, '2026-08-01', '12')]:
    pdf.setFillColor(HexColor('#147cd1'))
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(54, 783, 'SYNTHETIC DOCUMENT / SOFTWARE TEST ONLY')
    pdf.setFillColor(HexColor('#263746'))
    pdf.setFont('Helvetica-Bold', 24)
    pdf.drawString(54, 735, 'Source-linked report review')
    pdf.setFont('Helvetica', 11)
    for index, line in enumerate([
        f'Study date: {date}. Page {page} of 2.',
        'This is a geometric workflow example, not a patient report.',
        f'Region PDF-A measures {measurement} mm.',
        'No new lesion is described in this synthetic example.',
        'Demonstration protocol: MR T1c axial 1 mm.',
        'Recommendation: review a synthetic follow-up source.',
        'No clinical sensitivity or diagnostic accuracy is asserted.',
    ]):
        pdf.drawString(54, 684-index*28, line)
    pdf.setStrokeColor(HexColor('#e1e8ef'))
    pdf.line(54, 100, 541, 100)
    pdf.setFont('Helvetica', 9)
    pdf.drawString(54, 78, f'Original-source verification fixture | {page} / 2')
    pdf.showPage()
pdf.save()
print(target)
