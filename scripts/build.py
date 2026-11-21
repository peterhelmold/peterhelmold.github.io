"""把 content/ 里的资料和 templates/index.html 合成主页 index.html。

    python scripts/build.py          重新生成 index.html 和简历的跳转页 cv/index.html
    python scripts/build.py --check  只检查：生成的页面是否落后于资料和文件，链接的文件是否都在

资源链接后面的 ?v= 由文件内容算出，换了 PDF、图片或样式后重新生成即可。
"""

import argparse
import difflib
import hashlib
import html
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'content'
TEMPLATE = ROOT / 'templates' / 'index.html'
CV_REDIRECT = (
    '<!doctype html>\n'
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    '<meta http-equiv="refresh" content="0; url=../{cv}"><title>{name}</title></head>'
    '<body><p><a href="../{cv}">Continue to CV</a></p></body></html>\n'
)

# 课程资料按这个顺序显示，没列出的名称排在 Notes 前面
RESOURCE_ORDER = ['Essay', 'Report', 'Presentation']
RESOURCE_LAST = ['Notes']

COPY_ICONS = (
    '<svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">'
    '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>'
    '<svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    '<path d="m5.5 12.5 4.2 4L18.5 7.5"/></svg>'
)
TOGGLE = '<span class="toggle" aria-hidden="true"><i></i><i></i></span>'
LATEX = '<span class="latex" aria-label="LaTeX"><span aria-hidden="true">L<span class="a">A</span>T<span class="e">E</span>X</span></span>'


class Build:
    def __init__(self):
        self.used = set()      # 引用到的本地文件
        self.missing = []      # 引用了但不存在的文件

    def v(self, path):
        """本地文件加上按内容算出的 ?v=。"""
        path = str(path)
        file = ROOT / path
        self.used.add(path)
        if not file.is_file():
            self.missing.append(path)
            return e(path)
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        return e(f'{path}?v={digest[:12] if path.startswith("files/") else digest[:8]}')

    # ---------- 各区块 ----------

    def intro(self, p):
        links = [f'          <a class="capsule press" href="{self.v(p["cv"])}">Curriculum Vitae</a>']
        links += [f'          <a class="more" href="{e(l["url"])}">{e(l["label"])}</a>' for l in p.get('links', [])]
        return '\n'.join([
            '      <section class="intro" aria-labelledby="name">',
            '        <div class="identity">',
            f'          <figure class="portrait"><img src="images/profile-320.webp" srcset="images/profile-160.webp 160w, images/profile-320.webp 320w" sizes="(max-width: 600px) 72px, 88px" alt="{e(p["portrait_alt"])}" width="320" height="400" fetchpriority="high"></figure>',
            f'          <h1 id="name">{e(p["name"])}</h1>',
            '        </div>',
            f'        <p class="lead">{e(p["lead"])}</p>',
            '        <dl class="facts">',
            f'          <dt>Location</dt><dd>{e(p["location"])}</dd>',
            f'          <dt>Email</dt><dd class="email"><a id="email" href="mailto:{e(p["email"])}">{e(p["email"])}</a>'
            f'<button class="copy-button" type="button" data-copy="#email" aria-label="Copy email address" title="Copy email address" hidden>{COPY_ICONS}</button></dd>',
            '        </dl>',
            '        <div class="links">',
            *links,
            '        </div>',
            '      </section>',
        ])

    def education(self, schools):
        out = []
        for s in schools:
            name = f'<a href="{e(s["url"])}">{e(s["school"])}</a>' if s.get('url') else e(s['school'])
            out += [
                '        <div class="school">',
                f'          <span class="school-logo"><img src="{self.v(s["logo"])}" alt="" width="24" height="24"></span>',
                f'          <span class="school-name">{name}</span>',
                f'          <span class="when">{e(s["years"])}</span>',
                f'          <span class="degree">{e(s["degree"])}</span>',
                '        </div>',
            ]
        return '\n'.join(out)

    def research(self, papers):
        blocks = []
        for p in papers:
            pid = p['id']
            pdf = self.v(p['pdf'])
            title = [
                f'                <span class="venue">{e(p["venue"])}</span>',
                f'                <h3>{e(p["title"])}</h3>',
            ]
            if p.get('subtitle'):
                title.append(f'                <span class="subtitle">{e(p["subtitle"])}</span>')
            body = [f'              <p class="abstract">{e(a)}</p>' for a in p.get('abstract', [])]
            if p.get('results'):
                body += ['              <div class="results" aria-label="Main results">', '                <ol>']
                body += [f'                  <li><span>{e(r)}</span></li>' for r in p['results']]
                body += ['                </ol>', '              </div>']
            links = [f'            <a class="capsule press" href="{pdf}">Read PDF</a>']
            if p.get('slides'):
                links.append(f'            <a class="capsule gray press" href="{self.v(p["slides"])}">Slides</a>')
            links += [f'            <a class="more" href="{e(l["url"])}">{e(l["label"])}</a>' for l in p.get('links', [])]
            out = [
                '      <article class="publication">',
                '        <div class="cover-frame">',
                f'          <a class="cover" href="{pdf}" aria-label="Open the {e(pid)}’s thesis PDF">',
                f'            <img src="{self.v(p["cover"])}" alt="" width="640" height="905" loading="lazy">',
                '          </a>',
                '        </div>',
                '        <div class="publication-body">',
                f'          <details class="disclosure" id="thesis-{e(pid)}"{" data-hint open" if p.get("open") else ""}>',
                '            <summary class="publication-head">',
                '              <div class="publication-title">',
                *title,
                '              </div>',
                f'              {TOGGLE}',
                '            </summary>',
                '            <div class="disclosure-body"><div>',
                *body,
                '            </div></div>',
                '          </details>',
            ]
            if p.get('supervisor'):
                out.append(f'          <p class="byline">Supervised by {e(p["supervisor"])}</p>')
            out += ['          <div class="links">', *links]
            if p.get('bibtex'):
                out += [
                    f'            <button class="text-button press cite" type="button" aria-expanded="false" aria-controls="cite-{e(pid)}" hidden>Cite</button>',
                    '          </div>',
                    f'          <div class="citation disclosure-body" id="cite-{e(pid)}" hidden>',
                    '            <div class="citation-inner">',
                    f'              <button class="copy-button bib-copy" type="button" data-copy="#bibtex-{e(pid)}" aria-label="Copy BibTeX" title="Copy BibTeX" hidden>{COPY_ICONS}</button>',
                    f'              <pre class="bibtex" id="bibtex-{e(pid)}">{e(p["bibtex"].rstrip())}</pre>',
                    '            </div>',
                    '          </div>',
                ]
            else:
                out.append('          </div>')
            out += ['        </div>', '      </article>']
            blocks.append('\n'.join(out))
        return '\n\n'.join(blocks)

    def course_row(self, c):
        parts = c.get('parts') or [c]
        titles, metas = [], []
        for p in parts:
            titles.append(f'<a href="{e(p["url"])}">{e(p["title"])}</a>' if p.get('url') else f'<span>{e(p["title"])}</span>')
            metas.append(' · '.join(e(x) for x in (p.get('code'), p.get('term')) if x))
        pair = '<span class="course-pair">/</span>'
        row = (f'<li class="course-row"><div class="course-title"><span>{pair.join(titles)}</span>'
               f'<span class="course-meta">{" / ".join(metas)}</span></div>')
        files = c.get('files') or {}
        if files:
            name = ' / '.join(p['title'] for p in parts)
            kinds = sorted(files, key=resource_rank)
            row += '<div class="resources">' + ''.join(
                f'<a class="resource press" href="{self.v(files[k])}" aria-label="Read {e(name)} {e(k.lower())} PDF">{e(k)}</a>'
                for k in kinds) + '</div>'
        return row + '</li>'

    def courses(self, groups):
        out = []
        for g in groups:
            years = sorted(g['years'], key=lambda y: str(y['year']), reverse=True)
            count = sum(len(y['courses']) for y in years)
            cls = 'disclosure course course-columns' if g.get('columns') else 'disclosure course'
            out += [
                f'      <details class="{cls}" id="courses-{e(g["id"])}">',
                f'        <summary><span class="course-name">{e(g["name"])}</span><span class="course-count">{count} courses</span>{TOGGLE}</summary>',
                '        <div class="disclosure-body"><div>',
                '          <div class="years">',
            ]
            for y in years:
                rows = sorted(y['courses'], key=lambda c: (c.get('parts') or [c])[0]['title'].casefold())
                out += ['            <div class="year">', f'              <h4>{e(y["year"])}</h4>', '              <ul>']
                out += ['              ' + self.course_row(c) for c in rows]
                out += ['              </ul>', '            </div>']
            out += [
                '          </div>',
                f'          <div class="course-end"><button class="course-collapse press" type="button" hidden>{TOGGLE}Collapse {e(g["name"])}</button></div>',
                '        </div></div>',
                '      </details>',
            ]
        return '\n'.join(out)

    def skills(self, p):
        s = p['skills']
        tools = [LATEX if t == 'LaTeX' else e(t) for t in s['tools']]
        first = [t for t in tools if t == LATEX]
        rest = [t for t in tools if t != LATEX]
        tool_lines = [f'            <li>{t}</li>' for t in first]
        if rest:
            tool_lines.append('            ' + ''.join(f'<li>{t}</li>' for t in rest))
        return '\n'.join([
            '        <dt>Tools</dt>',
            '        <dd>',
            '          <ul class="tools" aria-label="Tools">',
            *tool_lines,
            '          </ul>',
            '        </dd>',
            '        <dt>Languages</dt>',
            '        <dd>',
            '          <ul class="languages">',
            *[f'            <li><strong>{e(l["name"])}</strong><span>{e(l["level"])}</span></li>' for l in s['languages']],
            '          </ul>',
            '        </dd>',
            '        <dt>Beyond Mathematics</dt>',
            f'        <dd>{e(s["beyond"])}</dd>',
        ])

    def footer(self, p):
        motto = re.sub(r'\*(.+?)\*', r'<span>\1</span>', e(p['motto']))
        return '\n'.join([
            f'      <p class="motto">{motto}</p>',
            f'      <span>{e(p["copyright"])} · <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a></span>',
        ])

    def render(self):
        profile = load('profile.yaml')
        parts = {
            'title': e(profile['title']),
            'description': e(profile['description']),
            'intro': self.intro(profile),
            'education': self.education(load('education.yaml')),
            'research': self.research(load('research.yaml')),
            'courses': self.courses(load('courses.yaml')),
            'skills': self.skills(profile),
            'footer': self.footer(profile),
        }
        page = TEMPLATE.read_text(encoding='utf-8')
        page = re.sub(r'\{\{v:([^}]+)\}\}', lambda m: self.v(m.group(1)), page)
        page = re.sub(r'\{\{(\w+)\}\}', lambda m: parts[m.group(1)], page)
        cv = CV_REDIRECT.format(cv=self.v(profile['cv']), name=e(profile['name']))
        return {'index.html': page, 'cv/index.html': cv}


def e(text):
    return html.escape(str(text), quote=True)


def resource_rank(kind):
    if kind in RESOURCE_ORDER:
        return (0, RESOURCE_ORDER.index(kind))
    if kind in RESOURCE_LAST:
        return (2, RESOURCE_LAST.index(kind))
    return (1, kind)


def load(name):
    with open(CONTENT / name, encoding='utf-8-sig') as f:
        return yaml.safe_load(f)


def unlinked(used):
    """files/ 里没有被主页链接的文件。"""
    return sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'files').rglob('*')
                  if p.is_file() and p.relative_to(ROOT).as_posix() not in used)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='只检查，不写文件')
    args = parser.parse_args()
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')

    build = Build()
    pages = build.render()
    problems = 0

    for path in build.missing:
        print(f'缺少文件：{path}')
        problems += 1
    for path in unlinked(build.used):
        print(f'没有链接到主页：{path}')

    for name, page in pages.items():
        out = ROOT / name
        current = out.read_text(encoding='utf-8') if out.exists() else ''
        if page == current:
            print(f'{name} 已是最新。')
        elif args.check:
            print(f'{name} 落后于资料或文件，有这些变化：')
            diff = difflib.unified_diff(current.splitlines(), page.splitlines(), name, '生成结果', n=0, lineterm='')
            for line in diff:
                if not line.startswith(('---', '+++', '@@')):
                    print('  ' + line[:300])
            problems += 1
        else:
            out.write_text(page, encoding='utf-8', newline='\n')
            print(f'已重新生成 {name}。')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
