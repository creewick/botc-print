const firstPageTypes = {
    "2bfc6e58-485f-8006-9d07-fe360e067c6b": "Горожане",
    "2bfc6e58-485f-804b-a4f2-fe76108367bc": "Изгои",
    "2bfc6e58-485f-80b4-b28c-d3f87189b821": "Приспешники",
    "2bfc6e58-485f-8059-b37f-d6cffbccbf6c": "Демоны",
}
const secondPageTypes = {
    "2bfc6e58-485f-8048-884c-fa29f3dbe5d6": "Летописцы",
    "2bfc6e58-485f-8072-9a69-e77527250fcf": "Сказочники",
    "2bfc6e58-485f-80d8-87ae-eb92d2bb40b3": "Странники",
}
const recommendedTravellers = ['thief', 'harlot', 'judge', 'beggar', 'scapegoat']

async function onInit() {
    const { ids, title } = parseQuery()
    const roles = await getJson('./roles.json')
    const jinxes = await getJson('./jinxes.json')
    const travellers = filterRoles(roles, recommendedTravellers)
    const filteredRoles = filterRoles(roles, ids)
    const filteredJinxes = filterJinxes(jinxes, filteredRoles)
    const djinn = filteredJinxes.length > 0 ? [roles.find(x => x.id === '2bfc6e58-485f-81c7-b450-de3becf2d115')] : []
    const systemRoles = filterRolesByType(roles, undefined)
    const page = (n) => document.getElementsByClassName('page')[n-1]

    document.title = title
    renderTitle(title)
    getRoleSections(filteredRoles, firstPageTypes, filteredJinxes).forEach(section => page(1).appendChild(section))
    getRoleSections([...filteredRoles, ...travellers, ...djinn], secondPageTypes).forEach(section => page(2).insertBefore(section, document.getElementById('players-count')))
    page(2).insertBefore(getJinxesSection(filteredRoles, filteredJinxes), document.getElementById('Странники'))
    page(3).appendChild(getNightOrderSection([...filteredRoles, ...systemRoles], 'Первая ночь порядок'))
    page(3).appendChild(getNightOrderSection([...filteredRoles, ...systemRoles], 'Другие ночи порядок'))

}

function parseQuery() {
    const query = new URLSearchParams(window.location.search)
    const ids = query.get('roles')?.split(',')?.map(id => id.trim())
    const title = query.get('title')?.trim()

    return ({ ids, title })
}

async function getJson(path) {
    const res = await fetch(path)

    if (!res.ok) 
        throw new Error(`Не удалось загрузить {path}`)
    
    return await res.json()
}

function filterRoles(roles, ids) {
    return ids
        .map(id => roles
            .find(role => role?.properties?.ID?.rich_text?.[0]?.plain_text === id))
        .filter(role => !!role)
}

function filterJinxes(jinxes, roles) {
    const ids = roles.map(role => role.id)
    return jinxes.filter(jinx => 
        jinx?.properties?.["Персонажи"]?.relation.every(x => ids.includes(x.id)))
}

function filterRolesByType(roles, typeId) {
    return roles.filter(role =>
        role?.properties?.["Тип"]?.relation?.[0]?.id === typeId
    )
}

function renderTitle(title) {
    Array.from(document.getElementsByClassName("script-title")).forEach(x => x.innerText = title ?? 'Сценарий')
}

function getRoleSections(roles, types, jinxes) {
    return Object.entries(types).map(([id, name]) => {
        const rolesByType = filterRolesByType(roles, id)
        return renderRoleType(rolesByType, name, id, roles, jinxes)
    }).filter(x => x)
}

function renderRoleType(roles, name, id, allRoles, jinxes) {
    if (roles.length === 0) return

    const section = document.createElement('section')
    section.classList.add('roleType')
    section.id = name
    section.style.flexGrow = roles.length;

    if (['2bfc6e58-485f-8006-9d07-fe360e067c6b', '2bfc6e58-485f-804b-a4f2-fe76108367bc'].includes(id))
        section.classList.add('good')
    if (['2bfc6e58-485f-80b4-b28c-d3f87189b821', '2bfc6e58-485f-8059-b37f-d6cffbccbf6c'].includes(id))
        section.classList.add('evil')
    if (['2bfc6e58-485f-8048-884c-fa29f3dbe5d6'].includes(id))
        section.classList.add('fabled')
    if (['2bfc6e58-485f-80d8-87ae-eb92d2bb40b3'].includes(id))
        section.classList.add('traveller')
  
    section.appendChild(renderTypeTitle(name))
    section.appendChild(renderRoleList(roles, allRoles, jinxes))

    return section
}

function renderTypeTitle(name) {
    const title = document.createElement('h2')
    title.innerText = name

    return title
}

function renderRoleList(roles, allRoles, jinxes) {
    const list = document.createElement('ul')

    for (let index = 0; index < roles.length; index++) {
        const role = roles[index]
        if (!role) continue
        const item = document.createElement('li')
        item.style.order = getRoleOrder(index, roles.length)

        const icon = document.createElement('img')
        const id = role.properties?.ID?.rich_text?.[0]?.plain_text
        icon.src = `./images/roles/${id}.png`
        item.appendChild(icon)

        const name = document.createElement('h3')
        name.innerText = role.properties?.["Название"]?.title?.[0]?.text?.content
        item.appendChild(name)

        if (jinxes) {
            const roleJinxes = jinxes.filter(x => x.properties?.["Персонажи"]?.relation?.some(r => r.id === role.id))
            if (roleJinxes.length > 0) console.log(id)
            
            for (const jinx of roleJinxes) {
                const pageId = jinx.properties?.["Персонажи"]?.relation.map(r => r.id).filter(id => id !== role.id)[0]    
                const jinxId = allRoles.find(x => x.id === pageId)?.properties?.ID?.rich_text?.[0]?.plain_text
                if (jinxId) {
                    const icon = document.createElement('img')
                    icon.classList.add('jinxIcon')
                    icon.src = `./images/roles/${jinxId}.png`
                    name.appendChild(icon)
                }             
            }
        }

        const ability = document.createElement('p')
        ability.innerText = role.properties?.["Способность"]?.rich_text?.[0]?.plain_text
        const setupText = role.properties?.["Замены"]?.rich_text?.[0]?.plain_text
        if (setupText) {
            const setup = document.createElement('span')
            setup.innerText = setupText
            setup.classList.add('roleSetup')
            ability.appendChild(setup)
        }
      
        item.appendChild(ability)

        list.appendChild(item)
    }
    
    return list
} 

function getRoleOrder(index, total) {
    const half = Math.ceil(total / 2)

    if (index < half) {
        return index * 2
    }

    return (index - half) * 2 + 1
}

function getJinxesSection(roles, jinxes) {
    if (jinxes.length === 0) return

    const section = document.createElement('section')
    section.classList.add('roleType')
    section.style.flexGrow = jinxes.length;
  
    section.appendChild(renderTypeTitle('Правила Джинна'))
    section.appendChild(renderJinxesList(roles, jinxes))

    return section
}

function renderJinxesList(roles, jinxes) {
    const list = document.createElement('ul')

    for (let index = 0; index < jinxes.length; index++) {
        const jinx = jinxes[index]
        if (!jinx) continue
        const item = document.createElement('li')
        item.classList.add('jinx')
        item.style.order = getRoleOrder(index, jinxes.length)

        const rolePageIds = jinx?.properties?.["Персонажи"]?.relation?.map(x => x.id)
        const roleIds = rolePageIds
            .map(pageId => roles.find(x => x.id === pageId))
            .map(page => page.properties?.ID?.rich_text?.[0]?.plain_text)

        const icon1 = document.createElement('img')
        icon1.src = `./images/roles/${roleIds[0]}.png`
        item.appendChild(icon1)

        const icon2 = document.createElement('img')
        icon2.src = `./images/roles/${roleIds[1]}.png`
        item.appendChild(icon2)

        const ability = document.createElement('p')
        ability.innerText = jinx.properties?.["Правило"]?.title.map(x => x.plain_text).join("")
        item.appendChild(ability)

        list.appendChild(item)
    }
    
    return list
} 

function getNightOrderSection(roles, key) {
    if (roles.length === 0) return

    const section = document.createElement('section')
    section.classList.add('roleType', 'nightOrder')
    if (key === 'Другие ночи порядок')
        section.classList.add('rotate180')
    section.style.flexGrow = roles.length;
  
    section.appendChild(renderTypeTitle(key))
    section.appendChild(renderNightOrderList(roles, key))
    
    return section
}

function renderNightOrderList(roles, key) {
    const list = document.createElement('ul')
    const filteredRoles = roles
        .filter(a => a?.properties?.[key]?.number !== null)
        .sort((a, b) => a?.properties?.[key]?.number - b?.properties?.[key]?.number)

    for (const role of filteredRoles) {
        const item = document.createElement('li')

        const icon = document.createElement('img')
        const id = role.properties?.ID?.rich_text?.[0]?.plain_text
        icon.src = `./images/roles/${id}.png`
        item.appendChild(icon)

        const name = document.createElement('h3')
        name.innerText = role.properties?.["Название"]?.title?.[0]?.text?.content
        item.appendChild(name) 
        
        list.appendChild(item)
    }

    return list
}

onInit()