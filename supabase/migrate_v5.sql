-- v5: sonno + libreria libri completa + task uni
-- prereqs (idempotente, anche se v4 non è stato eseguito)

alter table habit_templates add column if not exists allow_multi boolean default false;
alter table notes add column if not exists kind text default 'text';
alter table notes add column if not exists topic text;
alter table resources add column if not exists topic text;
alter table habit_logs drop constraint if exists habit_logs_template_id_log_date_key;
alter table habit_logs drop constraint if exists check_logs_template_id_log_date_key;

insert into habit_templates (title, section, frequency_type, frequency_value, preferred_rule, allow_multi, sort_order, active)
select 'Track sonno', 'Evening', 'daily', null, null, false, 255, true
where not exists (select 1 from habit_templates where title = 'Track sonno');

-- libri accademici (topic = materia)
insert into resources (title, content, tag, kind, topic)
select v.title, v.author, 'personal', 'libro', v.topic
from (values
  ('The Essential Peirce Vol. 1–2', 'Charles S. Peirce · Pragmatism, semiotics', 'semiotica'),
  ('I limiti dell''interpretazione', 'Umberto Eco · Semiotics', 'semiotica'),
  ('Languages of Art', 'Nelson Goodman · Representation', 'semiotica'),
  ('Pragmatism: An Open Question', 'Hilary Putnam', 'semiotica'),
  ('The New Rhetoric', 'Perelman & Olbrechts-Tyteca · Argumentation', 'semiotica'),
  ('Amusing Ourselves to Death', 'Neil Postman · Media ecology', 'media'),
  ('Risk Savvy', 'Gerd Gigerenzer · Heuristics', 'decisioni'),
  ('Principles of Biomedical Ethics', 'Beauchamp & Childress', 'bioetica'),
  ('QED: Strange Theory of Light and Matter', 'Richard Feynman', 'fisica'),
  ('Quantum Computing Since Democritus', 'Scott Aaronson', 'quantum'),
  ('The Beginning of Infinity', 'David Deutsch', 'fisica'),
  ('Proofs and Refutations', 'Imre Lakatos · Philosophy of math', 'matematica'),
  ('The Nature of Technology', 'W. Brian Arthur', 'tecnologia'),
  ('The Sciences of the Artificial', 'Herbert A. Simon', 'tecnologia'),
  ('Governing the Commons', 'Elinor Ostrom', 'istituzioni'),
  ('Micromotives and Macrobehavior', 'Thomas Schelling', 'economia'),
  ('Explaining Social Behavior', 'Jon Elster', 'economia'),
  ('Signals: Evolution, Learning, Information', 'Brian Skyrms', 'economia'),
  ('Networks, Crowds, and Markets', 'Easley & Kleinberg', 'reti'),
  ('Social and Economic Networks', 'Matthew O. Jackson', 'reti'),
  ('The Theory of Industrial Organization', 'Jean Tirole', 'microeconomia'),
  ('Auction Theory', 'Vijay Krishna', 'game-theory'),
  ('Game Theory for Applied Economists', 'Robert Gibbons', 'game-theory'),
  ('Algorithmic Game Theory', 'Nisan et al.', 'game-theory'),
  ('Convex Optimization', 'Boyd & Vandenberghe', 'ottimizzazione'),
  ('Computational Complexity', 'Arora & Barak', 'informatica'),
  ('Introduction to the Theory of Computation', 'Michael Sipser', 'informatica'),
  ('The Annotated Turing', 'Charles Petzold', 'informatica'),
  ('History of Economic Analysis', 'Joseph Schumpeter', 'storia-economia'),
  ('Economic Theory in Retrospect', 'Mark Blaug', 'storia-economia'),
  ('Economics Evolving', 'Agnar Sandmo', 'storia-economia'),
  ('History of Economic Thought', 'Landreth & Colander', 'storia-economia'),
  ('The Penguin History of Economics', 'Roger Backhouse', 'storia-economia'),
  ('A Companion to History of Economic Thought', 'Samuels et al.', 'storia-economia'),
  ('Economic Thought: A Brief History', 'Kurz & Salvadori', 'storia-economia'),
  ('A History of Economic Theory and Method', 'Ekelund & Hébert', 'storia-economia'),
  ('The Ordinary Business of Life', 'Roger Backhouse', 'storia-economia'),
  ('Quantum Computation and Quantum Information', 'Nielsen & Chuang', 'quantum'),
  ('Principles of Quantum Mechanics', 'R. Shankar', 'quantum'),
  ('Statistical Mechanics', 'James Sethna', 'fisica'),
  ('Spacetime and Geometry', 'Sean Carroll · GR', 'fisica'),
  ('Elements of Information Theory', 'Cover & Thomas', 'informatica'),
  ('Information Theory, Inference, Learning Algorithms', 'David MacKay', 'ML'),
  ('Probability Theory: The Logic of Science', 'E. T. Jaynes', 'probabilita'),
  ('The Elements of Statistical Learning', 'Hastie, Tibshirani, Friedman', 'ML'),
  ('Pattern Recognition and Machine Learning', 'Christopher Bishop', 'ML'),
  ('Causality', 'Judea Pearl', 'ML'),
  ('Causation, Prediction, and Search', 'Spirtes, Glymour, Scheines', 'ML'),
  ('Numerical Optimization', 'Nocedal & Wright', 'ottimizzazione'),
  ('Convex Analysis', 'Rockafellar', 'ottimizzazione'),
  ('Introduction to Algorithms', 'Cormen et al.', 'algoritmi'),
  ('Algorithm Design', 'Kleinberg & Tardos', 'algoritmi'),
  ('Microeconomic Theory', 'Mas-Colell, Whinston, Green', 'microeconomia'),
  ('Game Theory', 'Fudenberg & Tirole', 'game-theory'),
  ('Two-Sided Matching', 'Roth & Sotomayor', 'game-theory'),
  ('Mechanism Design: LP Approach', 'Rakesh Vohra', 'game-theory'),
  ('Handbook of Market Design', 'Vulkan, Roth, Neeman', 'game-theory'),
  ('Econometric Analysis', 'William Greene', 'econometria'),
  ('Mostly Harmless Econometrics', 'Angrist & Pischke', 'econometria'),
  ('Microeconometrics', 'Cameron & Trivedi', 'econometria'),
  ('Bayesian Data Analysis', 'Gelman et al.', 'econometria'),
  ('Network Science', 'Albert-László Barabási', 'reti'),
  ('Molecular Biology of the Cell', 'Alberts et al.', 'biologia'),
  ('Evolution and the Theory of Games', 'John Maynard Smith', 'biologia'),
  ('Evolutionary Dynamics', 'Martin Nowak', 'biologia'),
  ('Theoretical Neuroscience', 'Dayan & Abbott', 'neuroscienze'),
  ('Neuronal Dynamics', 'Gerstner et al.', 'neuroscienze'),
  ('Spikes: Exploring the Neural Code', 'Rieke et al.', 'neuroscienze'),
  ('Models as Mediators', 'Morgan & Morrison', 'filosofia-scienza'),
  ('The Logic of Scientific Discovery', 'Karl Popper', 'filosofia-scienza'),
  ('Against Method', 'Paul Feyerabend', 'filosofia-scienza'),
  ('The Knowledge Machine', 'Michael Strevens', 'filosofia-scienza'),
  ('Inference to the Best Explanation', 'Peter Lipton', 'filosofia-scienza'),
  ('Networked Life', 'Mung Chiang', 'reti'),
  ('Design Rules Vol. 1: Modularity', 'Baldwin & Clark', 'tecnologia'),
  ('Uomo che cammina', 'fumetto · da leggere', 'fumetti'),
  ('Planetes', 'fumetto · da leggere', 'fumetti'),
  ('Quartieri lontani', 'fumetto · da leggere', 'fumetti'),
  ('Corto Maltese', 'fumetto · da leggere', 'fumetti')
) as v(title, author, topic)
where not exists (
  select 1 from resources r where r.title = v.title and r.kind = 'libro'
);

insert into resources (title, content, tag, kind, topic)
select 'Combinatorial Optimization JBM090', 'Tilburg DS · ILP, open book exam, study required. Anyone did this course?', 'uni', 'libro', 'uni-corsi'
where not exists (select 1 from resources where title = 'Combinatorial Optimization JBM090');

insert into notes (title, content, tag, kind, topic)
select 'Combinatorial Optimization — appunti chat', 'Level 3, not that hard. Open book exam. Mostly ILP integer problems. Need to study, not free pass.', 'uni', 'text', 'uni-corsi'
where not exists (select 1 from notes where title = 'Combinatorial Optimization — appunti chat');
