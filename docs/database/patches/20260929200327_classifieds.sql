-- Classifieds: job ads shown on the home page
-- Date: 2026-09-29
-- Description: New table for job ads of the dental sector. Anyone can read active ads,
-- admins manage them. Includes demo ads for the presentation.

CREATE TABLE IF NOT EXISTS public.classifieds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text,
  job_type text,
  summary text,
  description text,
  requirements text,
  contact_email text,
  is_active boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.classifieds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active classifieds" ON public.classifieds;
CREATE POLICY "Public can read active classifieds" ON public.classifieds FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage classifieds" ON public.classifieds;
CREATE POLICY "Admins can manage classifieds" ON public.classifieds FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Demo data
INSERT INTO public.classifieds (title, company, location, job_type, summary, description, requirements, contact_email, published_at)
SELECT * FROM (VALUES
  ('Odontólogo/a general', 'Clínica Dental Sonrisas', 'Palermo, CABA', 'Part-time',
   'Buscamos odontólogo/a para atención de pacientes adultos, turno tarde.',
   'Clínica con 15 años de trayectoria busca profesional para sumarse al equipo. Atención de pacientes particulares y de obras sociales, de lunes a viernes de 14 a 20 hs. Consultorio equipado con radiología digital.',
   'Título habilitante y matrícula nacional vigente. Experiencia mínima de 2 años. Seguro de mala praxis al día.',
   'rrhh@sonrisas-demo.com', now() - interval '1 day'),
  ('Técnico/a dental en prótesis fija', 'Laboratorio Dental Núñez', 'Núñez, CABA', 'Full-time',
   'Laboratorio en crecimiento incorpora técnico/a para coronas y puentes.',
   'Trabajo en laboratorio con tecnología CAD/CAM. Fabricación de coronas de zirconio y metal-cerámica, puentes e incrustaciones. Lunes a viernes de 9 a 18 hs.',
   'Título de técnico dental. Experiencia en cerámica y zirconio. Manejo de software CAD es un plus.',
   'empleos@labnunez-demo.com', now() - interval '3 days'),
  ('Asistente dental', 'Consultorio Dra. Pereyra', 'La Plata, Buenos Aires', 'Full-time',
   'Consultorio de ortodoncia busca asistente para recepción y sillón.',
   'Tareas de asistencia en sillón, esterilización de instrumental, manejo de agenda y atención a pacientes. Horario de 9 a 17 hs.',
   'Secundario completo. Curso de asistente dental. Buena predisposición y trato con pacientes.',
   'consultorio.pereyra@demo.com', now() - interval '5 days'),
  ('Ortodoncista', 'Centro Odontológico del Sur', 'Lomas de Zamora, Buenos Aires', 'Por turnos',
   'Se busca especialista en ortodoncia para dos días por semana.',
   'Atención de pacientes con brackets metálicos, estéticos y alineadores. Se ofrece porcentaje sobre tratamientos y agenda con pacientes derivados.',
   'Especialidad en ortodoncia certificada. Matrícula provincial vigente.',
   'direccion@centrosur-demo.com', now() - interval '8 days'),
  ('Vendedor/a de insumos odontológicos', 'DentalMarket Distribuidora', 'Rosario, Santa Fe', 'Full-time',
   'Distribuidora busca vendedor/a para cartera de clínicas y laboratorios.',
   'Visita a clientes, presentación de productos, seguimiento de pedidos y cobranzas. Se ofrece sueldo fijo más comisiones y vehículo de la empresa.',
   'Experiencia en ventas, preferentemente en el rubro salud. Registro de conducir.',
   'ventas@dentalmarket-demo.com', now() - interval '10 days'),
  ('Recepcionista para clínica odontológica', 'Odontología Integral Belgrano', 'Belgrano, CABA', 'Part-time',
   'Clínica busca recepcionista para turno mañana.',
   'Recepción de pacientes, confirmación de turnos, facturación a obras sociales y manejo de caja. De lunes a sábado de 8 a 13 hs.',
   'Experiencia en atención al público. Manejo de PC. Se valora experiencia en consultorios.',
   'administracion@integralbelgrano-demo.com', now() - interval '12 days')
) AS demo(title, company, location, job_type, summary, description, requirements, contact_email, published_at)
WHERE NOT EXISTS (SELECT 1 FROM public.classifieds);
