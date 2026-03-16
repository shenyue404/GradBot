import XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import fs from 'fs/promises'

const firstSheetToJson = (filePath) => {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet)
}

export async function parseStudentExcel(filePath) {
  try {
    const rows = firstSheetToJson(filePath)
    return rows
      .map((row) => ({
        studentId: String(row['学号'] || row.studentId || '').trim(),
        name: String(row['姓名'] || row.name || '').trim(),
        department: String(row['学院'] || row.department || '').trim(),
        major: String(row['专业'] || row.major || '').trim(),
        grade: String(row['年级'] || row.grade || '').trim(),
        className: String(row['班级'] || row.className || row.class || '').trim(),
        email: String(row['邮箱'] || row.email || '').trim(),
        phone: String(row['电话'] || row.phone || '').trim(),
        advisor: String(row['指导教师'] || row.advisor || '').trim(),
        researchDirection: String(row['研究方向'] || row.researchDirection || '').trim(),
      }))
      .filter((item) => item.studentId && item.name && item.major)
  } catch (error) {
    console.error('parseStudentExcel failed:', error)
    throw new Error('学生 Excel 解析失败')
  }
}

export async function parseTeacherExcel(filePath) {
  try {
    const rows = firstSheetToJson(filePath)
    return rows
      .map((row) => ({
        teacherId: String(row['工号'] || row.teacherId || '').trim(),
        name: String(row['姓名'] || row.name || '').trim(),
        department: String(row['学院'] || row.department || '').trim(),
        title: String(row['职称'] || row.title || '').trim(),
        email: String(row['邮箱'] || row.email || '').trim(),
        phone: String(row['电话'] || row.phone || '').trim(),
        office: String(row['办公室'] || row.office || '').trim(),
        officeHours: String(row['答疑时间'] || row.officeHours || '').trim(),
        researchFields: String(row['研究方向'] || row.researchFields || '')
          .split(/[、,，;]/)
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((item) => item.teacherId && item.name)
  } catch (error) {
    console.error('parseTeacherExcel failed:', error)
    throw new Error('教师 Excel 解析失败')
  }
}

export async function exportTopicsToExcel(topics, outputPath) {
  try {
    const data = topics.map((topic) => {
      const student = topic.student || topic.dataValues?.student
      const keywords = topic.keywords || (typeof topic.get === 'function' ? topic.get('keywords') : [])
      return {
        学号: student?.studentId || '',
        姓名: student?.name || '',
        专业: student?.major || '',
        选题标题: topic.title,
        选题描述: topic.description || '',
        研究方向: topic.direction || '',
        关键词: Array.isArray(keywords) ? keywords.join('、') : '',
        状态: topic.status === 'confirmed' ? '已确认' : '草稿',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '选题信息')
    XLSX.writeFile(workbook, outputPath)
    return outputPath
  } catch (error) {
    console.error('exportTopicsToExcel failed:', error)
    throw new Error('Excel 导出失败')
  }
}

export async function exportTaskBookToWord(taskBook, student, topic, outputPath) {
  try {
    const studentName = student?.name || student?.dataValues?.name || ''
    const studentId = student?.studentId || student?.dataValues?.studentId || ''
    const studentMajor = student?.major || student?.dataValues?.major || ''
    const topicTitle = topic?.title || topic?.dataValues?.title || ''

    const content = taskBook.content || taskBook.dataValues?.content || ''
    const requirements = taskBook.requirements || taskBook.dataValues?.requirements || ''
    const schedule = taskBook.schedule || (typeof taskBook.get === 'function' ? taskBook.get('schedule') : []) || []

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: '毕业设计任务书',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),
            new Paragraph({ children: [new TextRun({ text: '学生姓名：', bold: true }), new TextRun({ text: studentName })] }),
            new Paragraph({ children: [new TextRun({ text: '学号：', bold: true }), new TextRun({ text: studentId })] }),
            new Paragraph({ children: [new TextRun({ text: '专业：', bold: true }), new TextRun({ text: studentMajor })] }),
            new Paragraph({ children: [new TextRun({ text: '选题：', bold: true }), new TextRun({ text: topicTitle })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '一、研究内容', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }),
            new Paragraph({ text: content || '待完善' }),
            new Paragraph({ text: '二、研究要求', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }),
            new Paragraph({ text: requirements || '待完善' }),
            new Paragraph({ text: '三、进度安排', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }),
            ...(Array.isArray(schedule) ? schedule : []).map((item) =>
              new Paragraph({
                text: `${item.phase || item.task || ''}：${item.task || item.description || ''}${item.deadline ? `（截至时间：${item.deadline}）` : ''}`,
              }),
            ),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    await fs.writeFile(outputPath, buffer)
    return outputPath
  } catch (error) {
    console.error('exportTaskBookToWord failed:', error)
    throw new Error('Word 导出失败')
  }
}
