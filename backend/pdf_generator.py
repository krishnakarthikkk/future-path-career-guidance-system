import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Custom Canvas that performs a two-pass render to determine the total page count
    and prints a professional header and footer with page numbers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#5A189A"))  # Purple theme accent
        
        # Header (Top of each page except maybe page 1, but we can do it on all pages for consistency)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 750, 558, 750)
        self.drawString(54, 755, "AI CAREER RECOMMENDATION & STUDENT PROFILE ANALYZER")
        
        # Footer
        self.line(54, 50, 558, 50)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4A5568"))
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 38, page_str)
        self.drawString(54, 38, f"Confidential Report | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        self.restoreState()

def generate_student_report(profile, recommendations):
    buffer = BytesIO()
    
    # Page setup - 0.75 in (54 pt) margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#3C096C"),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#7B2CBF"),
        spaceAfter=20
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#5A189A"),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )
    
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#2D3748")
    )
    
    body_text = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2D3748")
    )
    
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2D3748"),
        leftIndent=15,
        firstLineIndent=-10
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    
    story = []
    
    # --- HEADER / TITLE ---
    story.append(Paragraph("Student Profile & Career Analysis Report", title_style))
    story.append(Paragraph("Powered by Rule-Based Career Recommendation Engine", subtitle_style))
    story.append(Spacer(1, 10))
    
    # --- SECTION 1: PERSONAL & ACADEMIC INFORMATION ---
    story.append(Paragraph("1. Student Profile Summary", section_heading))
    
    personal = profile.get('personal_info', {})
    academic = profile.get('academic_info', {})
    
    profile_data = [
        [
            Paragraph("Full Name:", bold_label), Paragraph(personal.get('name', 'N/A'), body_text),
            Paragraph("College:", bold_label), Paragraph(personal.get('college', 'N/A'), body_text)
        ],
        [
            Paragraph("Email:", bold_label), Paragraph(personal.get('email', 'N/A'), body_text),
            Paragraph("Branch / Year:", bold_label), Paragraph(f"{personal.get('branch', 'N/A')} - Year {personal.get('year', 'N/A')}", body_text)
        ],
        [
            Paragraph("CGPA:", bold_label), Paragraph(str(academic.get('cgpa', 'N/A')), body_text),
            Paragraph("Class 10th / 12th:", bold_label), Paragraph(f"10th: {academic.get('tenth_percentage', 'N/A')}% | 12th: {academic.get('twelfth_percentage', 'N/A')}%", body_text)
        ]
    ]
    
    profile_table = Table(profile_data, colWidths=[80, 172, 80, 172])
    profile_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#EDF2F7")),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 15))
    
    # --- TECHNICAL SKILLS & INTERESTS ---
    tech = profile.get('technical_skills', {})
    extracur = profile.get('extracurriculars', {})
    
    skills_list = tech.get('skills', []) + tech.get('programming_languages', [])
    skills_str = ", ".join(skills_list) if skills_list else "None listed"
    interests_str = ", ".join(profile.get('interests', [])) if profile.get('interests') else "None listed"
    
    skills_data = [
        [Paragraph("Technical Skills:", bold_label), Paragraph(skills_str, body_text)],
        [Paragraph("Career Interests:", bold_label), Paragraph(interests_str, body_text)],
        [
            Paragraph("Extracurriculars:", bold_label), 
            Paragraph(
                f"NCC: {'Yes' if extracur.get('ncc') else 'No'} | "
                f"NSS: {'Yes' if extracur.get('nss') else 'No'} | "
                f"Sports: {', '.join(extracur.get('sports', [])) or 'None'} | "
                f"Club Activities: {', '.join(extracur.get('club_activities', [])) or 'None'}",
                body_text
            )
        ]
    ]
    
    skills_table = Table(skills_data, colWidths=[100, 404])
    skills_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#EDF2F7")),
    ]))
    story.append(skills_table)
    story.append(Spacer(1, 20))
    
    # --- SECTION 2: TOP RECOMMENDATIONS ---
    story.append(Paragraph("2. Top Recommended Careers", section_heading))
    
    rec_headers = [
        Paragraph("Rank", table_header_style),
        Paragraph("Career Pathway", table_header_style),
        Paragraph("Score", table_header_style),
        Paragraph("Key Match Reasons", table_header_style)
    ]
    
    rec_rows = [rec_headers]
    for idx, rec in enumerate(recommendations):
        reasons_bullet = "".join([f"• {r}<br/>" for r in rec.get('reasons', [])[:3]])
        rec_rows.append([
            Paragraph(str(idx + 1), body_text),
            Paragraph(f"<b>{rec.get('title')}</b><br/><font color='#7B2CBF'>Avg. Salary: {rec.get('average_salary')}</font>", body_text),
            Paragraph(f"<b>{rec.get('score')}%</b>", body_text),
            Paragraph(reasons_bullet, body_text)
        ])
        
    rec_table = Table(rec_rows, colWidths=[40, 130, 50, 284])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#5A189A")),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 20))
    
    # --- SECTION 3: SKILL GAP ANALYSIS & LEARNING ROADMAP ---
    story.append(PageBreak())  # Move roadmap to its own page for clean printing
    story.append(Paragraph("3. Skill Gap Analysis & Learning Roadmap", section_heading))
    
    for idx, rec in enumerate(recommendations[:3]):  # Focus on top 3 recommendations for roadmap
        title = rec.get('title')
        missing = rec.get('missing_skills', [])
        courses = rec.get('suggested_courses', [])
        
        career_heading = ParagraphStyle(
            f'CareerHeading_{idx}',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#7B2CBF"),
            spaceBefore=10,
            spaceAfter=4,
            keepWithNext=True
        )
        
        career_story = []
        career_story.append(Paragraph(f"Pathway {idx+1}: {title} (Compatibility: {rec.get('score')}%)", career_heading))
        
        # Missing Skills
        missing_text = ", ".join(missing) if missing else "None! You possess all core skills listed."
        career_story.append(Paragraph(f"<b>Missing/Target Skills:</b> {missing_text}", body_text))
        career_story.append(Spacer(1, 4))
        
        # Courses
        if courses:
            career_story.append(Paragraph("<b>Suggested Learning Resources:</b>", bold_label))
            for course in courses[:3]:
                platform = course.get('platform', 'Online')
                ctype = course.get('type', 'Course')
                ctitle = course.get('title')
                career_story.append(Paragraph(f"• [{ctype}] {ctitle} — <i>{platform}</i>", bullet_style))
        else:
            career_story.append(Paragraph("• No active courses logged in the master seed catalog for this track.", bullet_style))
            
        career_story.append(Spacer(1, 8))
        story.append(KeepTogether(career_story))
        
    # --- SUGGESTIONS & PREPARATION ROADMAP ---
    roadmap_heading = ParagraphStyle(
        'RoadmapHeading',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#3C096C"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    roadmap_story = []
    roadmap_story.append(Paragraph("Strategic Preparation Advice", roadmap_heading))
    roadmap_story.append(Paragraph("1. <b>Bridge Skill Gaps:</b> Focus on enrolling in the recommended courses above, targeting 1 skill at a time.", bullet_style))
    roadmap_story.append(Paragraph("2. <b>Build Practical Projects:</b> Demonstrate missing skills by creating hands-on projects and storing them on GitHub.", bullet_style))
    roadmap_story.append(Paragraph("3. <b>Polish Soft Skills:</b> Practice public speaking and seek leadership roles in student clubs or volunteering events.", bullet_style))
    roadmap_story.append(Paragraph("4. <b>Resume & Networking:</b> Keep your profiles (LinkedIn, GitHub) updated with certifications and achievements.", bullet_style))
    
    story.append(KeepTogether(roadmap_story))
    
    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    return buffer
