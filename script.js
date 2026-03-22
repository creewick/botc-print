async function onInit() {
    const { ids, title } = parseQuery()
    const roles = await getJson('./roles.json')
    const types = await getJson('./types.json')
    const filteredRoles = filterRoles(roles, ids)

    renderTitle(title)
    renderRoles(filteredRoles, types)
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

function reorderRoles(roles) {
    const half = Math.ceil(roles.length / 2);

    return Array.from({ length: roles.length + roles.length % 2 }, (_, i) => {
        if (i % 2 === 0) return roles[i / 2];
        return roles[(i - 1) / 2 + half]
    })
}

function filterRolesByType(roles, typeId) {
    return roles.filter(role =>
        role?.properties?.["Тип"]?.relation?.[0]?.id === typeId
    )
}

function renderTitle(title) {
    document.getElementById("script-title").innerText = title ?? 'Сценарий'
}

function renderRoles(roles, types) {
    Object.entries(types).forEach(([id, name]) => {
        const rolesByType = filterRolesByType(roles, id)
        renderRoleType(rolesByType, name, id)
    })
}

function renderRoleType(roles, name, id) {
    if (roles.length === 0) return

    const section = document.createElement('section')

    if (['2bfc6e58-485f-8006-9d07-fe360e067c6b', '2bfc6e58-485f-804b-a4f2-fe76108367bc'].includes(id))
        section.classList.add('good')
    if (['2bfc6e58-485f-80b4-b28c-d3f87189b821', '2bfc6e58-485f-8059-b37f-d6cffbccbf6c'].includes(id))
        section.classList.add('evil')
  
    section.appendChild(renderTypeTitle(name))
    section.appendChild(renderRoleList(roles))
    
    document.getElementsByClassName('page')[0].appendChild(section)
}

function renderTypeTitle(name) {
    const title = document.createElement('h2')
    title.innerText = name

    return title
}

function renderRoleList(roles) {
    const list = document.createElement('ul')
    const orderedRoles = reorderRoles(roles)

    for (const role of orderedRoles) {
        if (!role) continue
        const item = document.createElement('li')

        const icon = document.createElement('img')
        const id = role.properties?.ID?.rich_text?.[0]?.plain_text
        icon.src = `./images/roles/${id}.png`
        item.appendChild(icon)

        const name = document.createElement('h3')
        name.innerText = role.properties?.["Название"]?.title?.[0]?.text?.content
        item.appendChild(name)

        const ability = document.createElement('p')
        ability.innerText = role.properties?.["Способность"]?.rich_text?.[0]?.plain_text
        item.appendChild(ability)

        list.appendChild(item)
    }
    
    return list
} 

onInit()