import { writeFile } from "fs/promises"

const NOTION_TOKEN = process.env.NOTION_SECRET
const NOTION_VERSION = '2026-03-11'
const ROLES_DB_ID = process.env.ROLES_DB_ID
const JINXES_DB_ID = process.env.JINXES_DB_ID

async function main() {
    if (!NOTION_TOKEN || !ROLES_DB_ID || !TYPES_DB_ID || !JINXES_DB_ID) {
        throw new Error('Missing ENV parameters')
    }

    saveDatabase(ROLES_DB_ID, 'roles')
    saveDatabase(JINXES_DB_ID, 'jinxes')
}

async function saveDatabase(sourceId, name) {
    console.log(`Fetching ${name}...`)
    let results = [], hasMore = true, cursor = undefined, page = 1

    while (hasMore) {
        const data = await fetchData(sourceId, cursor)
        console.log(`  Got ${name} page #${page++}`)
        results.push(...data.results)
        hasMore = data.has_more
        cursor = data.next_cursor
    }
    
    console.log(`Saving ${name} JSON...`)
    await writeFile(name + '.json', JSON.stringify(results), { encoding: "utf8" })

    console.log(`Saving ${name} icons...`)
    await fetchIcons(name, results)
}

async function fetchData(sourceId, start_cursor) {
    const res = await fetch(`https://api.notion.com/v1/data_sources/${sourceId}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': NOTION_VERSION,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            page_size: 100,
            start_cursor,
        }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Notion API error ${res.status}: ${text}`)
    }

    return await res.json()
}

async function fetchIcons(folder, json) {
    for (let i = 0; i < json.length; i++) {
        const url = json?.[i]?.icon?.file?.url
        const name = json?.[i]?.properties?.ID?.rich_text?.[0]?.plain_text
            ?? json?.[i]?.id
        if (!url) continue

        const res = await fetch(url)

        if (!res.ok) {
            console.error(`Failed to download icon for ${name}`)
            continue
        }
        if (i % 10 === 0)
            console.log(`- Got ${folder} icon #${i+1}`)

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        await writeFile(`images/${folder}/${name}.png`, buffer)
    }
}

await main()